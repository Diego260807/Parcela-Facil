/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartao, Compra, Parcela, ProjecaoMes, RecomendacaoCartao } from '../types/finance';

/**
 * Calcula o mês/ano (YYYY-MM) da primeira fatura em que a compra será lançada,
 * baseado na data da compra e no dia de fechamento e vencimento do cartão.
 */
export function calcularPrimeiraFatura(dataCompraStr: string, diaFechamento: number, diaVencimento: number): {
  mesAnoFatura: string; // "YYYY-MM"
  dataVencimentoReal: string; // "YYYY-MM-DD"
  diasAteVencimento: number;
} {
  const [anoStr, mesStr, diaStr] = dataCompraStr.split('-');
  const anoCompra = parseInt(anoStr, 10);
  const mesCompraIndex = parseInt(mesStr, 10) - 1; // 0-11
  const diaCompra = parseInt(diaStr, 10);

  const dataCompraObj = new Date(anoCompra, mesCompraIndex, diaCompra, 12, 0, 0);

  let targetYear = anoCompra;
  let targetMonth = mesCompraIndex; // 0-indexed

  // Se comprou no dia do fechamento ou depois, a fatura atual já fechou!
  // Entra na fatura seguinte (dando até 35-40 dias para pagar).
  const comprouAposFechamento = diaCompra >= diaFechamento;

  if (comprouAposFechamento) {
    targetMonth += 1;
  }

  // Se o vencimento for menor ou igual ao fechamento (ex: fecha dia 28 e vence dia 5 do mês seguinte),
  // a data de vencimento correspondente ao ciclo cai no mês posterior ao fechamento.
  if (diaVencimento <= diaFechamento) {
    targetMonth += 1;
  }

  // Ajusta transbordamento de ano
  const dataVencimentoPrevista = new Date(targetYear, targetMonth, 1);
  const anoFinal = dataVencimentoPrevista.getFullYear();
  const mesFinal = dataVencimentoPrevista.getMonth(); // 0-11

  // Determinar o dia real de vencimento garantindo que o mês suporte o dia (ex: fev 28)
  const maxDiasNoMes = new Date(anoFinal, mesFinal + 1, 0).getDate();
  const diaReal = Math.min(diaVencimento, maxDiasNoMes);

  const dataVencimentoRealObj = new Date(anoFinal, mesFinal, diaReal, 12, 0, 0);
  const diffTime = dataVencimentoRealObj.getTime() - dataCompraObj.getTime();
  const diasAteVencimento = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const mesFormatado = String(mesFinal + 1).padStart(2, '0');
  const diaFormatado = String(diaReal).padStart(2, '0');

  return {
    mesAnoFatura: `${anoFinal}-${mesFormatado}`,
    dataVencimentoReal: `${anoFinal}-${mesFormatado}-${diaFormatado}`,
    diasAteVencimento,
  };
}

/**
 * Gera a lista completa de parcelas de uma compra, ajustando centavos de arredondamento.
 */
export function gerarParcelas(compra: Compra, cartao: Cartao): Parcela[] {
  const parcelas: Parcela[] = [];
  const totalParcelas = Math.max(1, compra.quantidadeParcelas);
  const valorTotal = compra.valorTotal;

  // Divisão de centavos
  const valorBase = Math.floor((valorTotal / totalParcelas) * 100) / 100;
  const diferencaCentavos = Math.round((valorTotal - valorBase * totalParcelas) * 100) / 100;

  const [anoPrimeira, mesPrimeira] = compra.primeiraFaturaMes.split('-').map(Number);

  for (let i = 0; i < totalParcelas; i++) {
    // Calcula o mês de vencimento da parcela i
    const dataRef = new Date(anoPrimeira, mesPrimeira - 1 + i, 1);
    const anoParcela = dataRef.getFullYear();
    const mesParcela = dataRef.getMonth() + 1; // 1-12
    const mesAnoStr = `${anoParcela}-${String(mesParcela).padStart(2, '0')}`;

    // Dia de vencimento do mês
    const maxDias = new Date(anoParcela, mesParcela, 0).getDate();
    const diaReal = Math.min(cartao.diaVencimento, maxDias);
    const dataVencimentoReal = `${mesAnoStr}-${String(diaReal).padStart(2, '0')}`;

    // A primeira parcela absorve os centavos de ajuste para o total fechar perfeito
    const valorParcela = i === 0 ? Number((valorBase + diferencaCentavos).toFixed(2)) : valorBase;

    parcelas.push({
      id: `${compra.id}-parc-${i + 1}`,
      compraId: compra.id,
      cartaoId: cartao.id,
      numeroParcela: i + 1,
      totalParcelas,
      valor: valorParcela,
      mesVencimento: mesAnoStr,
      dataVencimentoReal,
      paga: false,
    });
  }

  return parcelas;
}

/**
 * Avalia todos os cartões cadastrados e indica qual o melhor cartão para comprar HOJE
 * (aquele que dará o maior número de dias até o pagamento da fatura).
 */
export function obterMelhorCartaoParaHoje(cartoes: Cartao[], dataHoje: Date = new Date()): RecomendacaoCartao[] {
  const hojeStr = dataHoje.toISOString().split('T')[0];

  const recomendacoes: RecomendacaoCartao[] = cartoes.map((cartao) => {
    const calc = calcularPrimeiraFatura(hojeStr, cartao.diaFechamento, cartao.diaVencimento);
    const hojeDia = dataHoje.getDate();
    const comprouAposFechamento = hojeDia >= cartao.diaFechamento;

    let motivo = '';
    if (comprouAposFechamento) {
      motivo = `Fatura já fechou dia ${cartao.diaFechamento}. Compra cai somente na fatura de ${formatarMesAno(calc.mesAnoFatura)}!`;
    } else {
      const diasRestantesAteFechar = cartao.diaFechamento - hojeDia;
      motivo = `Fatura fecha em ${diasRestantesAteFechar} dias (dia ${cartao.diaFechamento}). Vence dia ${cartao.diaVencimento}.`;
    }

    return {
      cartao,
      diasAteVencimento: calc.diasAteVencimento,
      dataVencimentoPrevista: calc.dataVencimentoReal,
      faturaAlvo: calc.mesAnoFatura,
      melhorOpcaoHoje: false,
      motivo,
    };
  });

  // Ordena pelo maior prazo até o vencimento
  recomendacoes.sort((a, b) => b.diasAteVencimento - a.diasAteVencimento);

  if (recomendacoes.length > 0) {
    recomendacoes[0].melhorOpcaoHoje = true;
  }

  return recomendacoes;
}

/**
 * Calcula a projeção mensal de gastos para os próximos N meses (3, 6, 12, 24).
 */
export function calcularProjecaoMensal(
  cartoes: Cartao[],
  compras: Compra[],
  mesesProjecao: number = 12,
  mesInicial?: string
): ProjecaoMes[] {
  const cartaoMap = new Map(cartoes.map((c) => [c.id, c]));

  // Gerar todas as parcelas de todas as compras ativas
  const todasParcelas: (Parcela & { compraDescricao: string; cartaoNome: string; categoriaNome: string })[] = [];

  compras.forEach((compra) => {
    const cartao = cartaoMap.get(compra.cartaoId);
    if (!cartao) return;
    const parcelas = gerarParcelas(compra, cartao);
    parcelas.forEach((p) => {
      todasParcelas.push({
        ...p,
        compraDescricao: compra.descricao,
        cartaoNome: cartao.nome,
        categoriaNome: compra.categoriaId,
      });
    });
  });

  // Determinar o mês inicial
  let inicioDate: Date;
  if (mesInicial) {
    const [y, m] = mesInicial.split('-').map(Number);
    inicioDate = new Date(y, m - 1, 1);
  } else {
    const now = new Date();
    inicioDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const projecoes: ProjecaoMes[] = [];

  for (let i = 0; i < mesesProjecao; i++) {
    const currentRef = new Date(inicioDate.getFullYear(), inicioDate.getMonth() + i, 1);
    const ano = currentRef.getFullYear();
    const mesNum = currentRef.getMonth() + 1;
    const mesAnoStr = `${ano}-${String(mesNum).padStart(2, '0')}`;

    // Filtrar parcelas que vencem neste mês
    const parcelasDoMes = todasParcelas.filter((p) => p.mesVencimento === mesAnoStr);
    const totalFatura = parcelasDoMes.reduce((acc, p) => acc + p.valor, 0);

    const totalPorCartao: Record<string, number> = {};
    const totalPorCategoria: Record<string, number> = {};

    parcelasDoMes.forEach((p) => {
      totalPorCartao[p.cartaoId] = (totalPorCartao[p.cartaoId] || 0) + p.valor;
      totalPorCategoria[p.categoriaNome] = (totalPorCategoria[p.categoriaNome] || 0) + p.valor;
    });

    projecoes.push({
      mesAno: mesAnoStr,
      mesFormatado: formatarMesAno(mesAnoStr),
      totalFatura: Number(totalFatura.toFixed(2)),
      totalPorCartao,
      totalPorCategoria,
      parcelas: parcelasDoMes,
    });
  }

  return projecoes;
}

/**
 * Calcula a curva de amortização / redução da dívida ao longo dos meses.
 */
export function calcularCurvaReducaoDivida(projecoes: ProjecaoMes[]): { mes: string; dividaRestante: number; valorMes: number }[] {
  // A dívida total inicial é a soma de todas as parcelas futuras
  let dividaRestante = projecoes.reduce((acc, mes) => acc + mes.totalFatura, 0);

  return projecoes.map((mes) => {
    const valorMes = mes.totalFatura;
    const item = {
      mes: mes.mesFormatado,
      dividaRestante: Number(Math.max(0, dividaRestante).toFixed(2)),
      valorMes,
    };
    dividaRestante -= valorMes;
    return item;
  });
}

/**
 * Calcula a economia na quitação antecipada de parcelas com base em taxa de juros composta reversa
 * (similar ao modelo adotado pelo Nubank e grandes emissores).
 */
export function calcularEconomiaAntecipacao(
  parcelasRestantes: Parcela[],
  taxaDescontoAnual: number = 0.10 // 10% a.a.
): {
  totalOriginal: number;
  totalComDesconto: number;
  economiaTotal: number;
  percentualEconomia: number;
  detalhePorParcela: { numero: number; valorOriginal: number; valorDescontado: number; economia: number; mesesAntecipados: number }[];
} {
  const taxaMensal = Math.pow(1 + taxaDescontoAnual, 1 / 12) - 1;
  let totalOriginal = 0;
  let totalComDesconto = 0;

  const detalhePorParcela = parcelasRestantes.map((p, index) => {
    const mesesAntecipados = index + 1; // 1 mês adiante, 2 meses adiante...
    const fatorDesconto = 1 / Math.pow(1 + taxaMensal, mesesAntecipados);
    const valorDescontado = Number((p.valor * fatorDesconto).toFixed(2));
    const economia = Number((p.valor - valorDescontado).toFixed(2));

    totalOriginal += p.valor;
    totalComDesconto += valorDescontado;

    return {
      numero: p.numeroParcela,
      valorOriginal: p.valor,
      valorDescontado,
      economia,
      mesesAntecipados,
    };
  });

  totalOriginal = Number(totalOriginal.toFixed(2));
  totalComDesconto = Number(totalComDesconto.toFixed(2));
  const economiaTotal = Number((totalOriginal - totalComDesconto).toFixed(2));
  const percentualEconomia = totalOriginal > 0 ? Number(((economiaTotal / totalOriginal) * 100).toFixed(1)) : 0;

  return {
    totalOriginal,
    totalComDesconto,
    economiaTotal,
    percentualEconomia,
    detalhePorParcela,
  };
}

/**
 * Formata "YYYY-MM" para exibição humanizada em português: "Nov 2026", "Dez 2026", etc.
 */
export function formatarMesAno(mesAnoStr: string): string {
  if (!mesAnoStr || !mesAnoStr.includes('-')) return mesAnoStr;
  const [ano, mes] = mesAnoStr.split('-').map(Number);
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[mes - 1]} ${ano}`;
}

/**
 * Formata valor para moeda brasileira BRL: "R$ 1.250,00"
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
