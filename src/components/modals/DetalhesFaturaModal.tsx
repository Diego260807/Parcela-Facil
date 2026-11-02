/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  CreditCard,
  ShoppingBag,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  PieChart,
  Tag,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { Cartao, ProjecaoMes } from '../../types/finance';
import { formatarMoeda, formatarMesAno } from '../../services/installmentEngine';

interface DetalhesFaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mesAnoSelecionado: string; // Ex: "2026-11"
  projecoes: ProjecaoMes[];
  cartoes: Cartao[];
  onExportarPDF: (projecao: ProjecaoMes) => void;
  onTrocarMes: (novoMesAno: string) => void;
  onNovaCompra?: () => void;
}

export const DetalhesFaturaModal: React.FC<DetalhesFaturaModalProps> = ({
  isOpen,
  onClose,
  mesAnoSelecionado,
  projecoes,
  cartoes,
  onExportarPDF,
  onTrocarMes,
  onNovaCompra,
}) => {
  const [filtroCartaoId, setFiltroCartaoId] = useState<string>('todos');

  if (!isOpen) return null;

  // Encontra a projeção correspondente ao mês selecionado
  const projecaoIndex = projecoes.findIndex((p) => p.mesAno === mesAnoSelecionado);
  const projecaoAtual = projecaoIndex !== -1 ? projecoes[projecaoIndex] : projecoes[0];

  if (!projecaoAtual) return null;

  // Navegação mês anterior e próximo
  const temAnterior = projecaoIndex > 0;
  const temProximo = projecaoIndex < projecoes.length - 1;

  const handleAnterior = () => {
    if (temAnterior) {
      onTrocarMes(projecoes[projecaoIndex - 1].mesAno);
    }
  };

  const handleProximo = () => {
    if (temProximo) {
      onTrocarMes(projecoes[projecaoIndex + 1].mesAno);
    }
  };

  // Filtrar parcelas pelo cartão selecionado
  const parcelasExibidas =
    filtroCartaoId === 'todos'
      ? projecaoAtual.parcelas
      : projecaoAtual.parcelas.filter((p) => p.cartaoId === filtroCartaoId);

  // Total do filtro atual
  const totalFiltrado = parcelasExibidas.reduce((acc, p) => acc + p.valor, 0);

  // Cartões que possuem lançamentos neste mês
  const cartoesComGastos = cartoes.filter(
    (c) => (projecaoAtual.totalPorCartao[c.id] || 0) > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Espelho da Fatura */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Espelho da Fatura
                </span>
                <span className="text-xs text-slate-400">
                  {parcelasExibidas.length} itens cobrados
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                Fatura de {projecaoAtual.mesFormatado}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Exportação Direta em PDF */}
            <button
              onClick={() => onExportarPDF(projecaoAtual)}
              title="Baixar PDF desta fatura"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors shadow-2xs"
            >
              <FileText className="h-4 w-4 text-rose-600" />
              <span className="hidden sm:inline">Baixar Fatura PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Barra de Navegação Temporal de Mês (< Mês >) e Banner de Total */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Controles de Mês Anterior / Próximo */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
              <button
                onClick={handleAnterior}
                disabled={!temAnterior}
                title="Mês Anterior"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 text-xs font-bold text-white min-w-[90px] text-center">
                {projecaoAtual.mesFormatado}
              </span>

              <button
                onClick={handleProximo}
                disabled={!temProximo}
                title="Próximo Mês"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs text-slate-400 hidden md:inline">
              Navegue entre as faturas futuras
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              {filtroCartaoId === 'todos' ? 'Total Consolidado da Fatura' : 'Subtotal do Cartão'}
            </span>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatarMoeda(totalFiltrado)}
            </div>
          </div>
        </div>

        {/* Filtro por Cartão de Crédito */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filtrar Cartão:</span>

          <button
            onClick={() => setFiltroCartaoId('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              filtroCartaoId === 'todos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos os Cartões ({formatarMoeda(projecaoAtual.totalFatura)})
          </button>

          {cartoesComGastos.map((cartao) => {
            const valorCartao = projecaoAtual.totalPorCartao[cartao.id] || 0;
            const isSelected = filtroCartaoId === cartao.id;

            return (
              <button
                key={cartao.id}
                onClick={() => setFiltroCartaoId(cartao.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cartao.corHex }}
                />
                <span>{cartao.nome}</span>
                <span className="font-bold opacity-80">({formatarMoeda(valorCartao)})</span>
              </button>
            );
          })}
        </div>

        {/* Lista de Parcelas / Lançamentos desta Fatura */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {parcelasExibidas.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-sm text-slate-700">
                Nenhuma parcela cadastrada para este filtro no mês de {projecaoAtual.mesFormatado}.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {parcelasExibidas.map((parc) => {
                const cartao = cartoes.find((c) => c.id === parc.cartaoId);

                return (
                  <div
                    key={parc.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingBag className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {parc.compraDescricao}
                        </h4>

                        <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1 flex-wrap">
                          {cartao && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cartao.corHex }}
                              />
                              {cartao.nome}
                            </span>
                          )}

                          <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            Parcela {parc.numeroParcela} de {parc.totalParcelas}
                          </span>

                          <span className="text-slate-400">
                            Vencimento: <strong>{parc.dataVencimentoReal}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col items-center sm:items-end justify-between">
                      <div className="text-base font-black text-slate-900">
                        {formatarMoeda(parc.valor)}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Agendada para fatura
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé com Resumo e Ação de Fechar */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-center sm:text-left">
            Total de parcelas deste mês:{' '}
            <strong className="text-slate-800">{parcelasExibidas.length}</strong> | Valor total:{' '}
            <strong className="text-indigo-600">{formatarMoeda(totalFiltrado)}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNovaCompra && (
              <button
                onClick={() => {
                  onClose();
                  onNovaCompra();
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold transition-colors"
              >
                + Lançar Compra
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
            >
              Fechar Espelho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
