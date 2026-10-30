/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cartao, Compra, ProjecaoMes } from '../types/finance';
import { formatarMoeda, formatarMesAno } from './installmentEngine';

export function exportarRelatorioExcel(
  cartoes: Cartao[],
  compras: Compra[],
  projecoes: ProjecaoMes[]
) {
  const wb = XLSX.utils.book_new();
  const cartaoMap = new Map(cartoes.map((c) => [c.id, c.nome]));

  // 1. Aba de Projeção Mensal
  const linhasProjecao = projecoes.map((p) => {
    const row: Record<string, string | number> = {
      'Mês de Referência': p.mesFormatado,
      'Total da Fatura (R$)': p.totalFatura,
      'Qtd. de Parcelas no Mês': p.parcelas.length,
    };
    cartoes.forEach((c) => {
      row[`Fatura ${c.nome} (R$)`] = p.totalPorCartao[c.id] || 0;
    });
    return row;
  });
  const wsProjecao = XLSX.utils.json_to_sheet(linhasProjecao);
  XLSX.utils.book_append_sheet(wb, wsProjecao, 'Projeção de Faturas');

  // 2. Aba de Detalhamento das Parcelas Futuras
  const todasParcelasDetalhadas: Record<string, string | number>[] = [];
  projecoes.forEach((p) => {
    p.parcelas.forEach((parc) => {
      todasParcelasDetalhadas.push({
        'Mês Cobrança': p.mesFormatado,
        'Compra': parc.compraDescricao,
        'Cartão': parc.cartaoNome,
        'Categoria': parc.categoriaNome,
        'Nº Parcela': `${parc.numeroParcela} / ${parc.totalParcelas}`,
        'Valor (R$)': parc.valor,
        'Data Vencimento': parc.dataVencimentoReal,
      });
    });
  });
  const wsParcelas = XLSX.utils.json_to_sheet(todasParcelasDetalhadas);
  XLSX.utils.book_append_sheet(wb, wsParcelas, 'Todas as Parcelas');

  // 3. Aba de Compras Cadastradas
  const linhasCompras = compras.map((c) => ({
    'Descrição': c.descricao,
    'Estabelecimento': c.estabelecimento || '-',
    'Cartão': cartaoMap.get(c.cartaoId) || 'Outro',
    'Valor Total (R$)': c.valorTotal,
    'Qtd Parcelas': c.quantidadeParcelas,
    'Data da Compra': c.dataCompra,
    'Início Cobrança': c.primeiraFaturaMes,
    'Observações': c.observacoes || '',
  }));
  const wsCompras = XLSX.utils.json_to_sheet(linhasCompras);
  XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras Originais');

  const dataAtual = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ParcelaFacil_Relatorio_Financeiro_${dataAtual}.xlsx`);
}

export function exportarFaturaPDF(
  projecao: ProjecaoMes,
  cartoes: Cartao[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Top header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  // Accent bar
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 36, 210, 2, 'F');

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('ParcelaFácil', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Relatório Consolidado de Fatura e Parcelas Futuras', 14, 26);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 31);

  // Big invoice card box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 44, 182, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 44, 182, 24, 2, 2, 'S');

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('MÊS DE REFERÊNCIA', 20, 52);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(projecao.mesFormatado.toUpperCase(), 20, 61);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DESTA FATURA', 120, 52);
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(formatarMoeda(projecao.totalFatura), 120, 62);

  // Subtotais por Cartão
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Composição por Cartão de Crédito:', 14, 76);

  let currentY = 82;
  cartoes.forEach((cartao) => {
    const subtotal = projecao.totalPorCartao[cartao.id] || 0;
    if (subtotal > 0) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`• ${cartao.nome} (Venc: dia ${cartao.diaVencimento}):`, 16, currentY);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(formatarMoeda(subtotal), 110, currentY);
      currentY += 6;
    }
  });

  // Table of installments
  const tabelaLinhas = projecao.parcelas.map((parc) => [
    parc.compraDescricao,
    parc.cartaoNome,
    `${parc.numeroParcela}/${parc.totalParcelas}`,
    parc.dataVencimentoReal,
    formatarMoeda(parc.valor),
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Descrição da Compra', 'Cartão', 'Parcela', 'Vencimento', 'Valor']],
    body: tabelaLinhas,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // Footer notes
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 250;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado pelo sistema ParcelaFácil. Controle inteligente de compromissos futuros.', 14, finalY);

  doc.save(`ParcelaFacil_Fatura_${projecao.mesAno}.pdf`);
}
