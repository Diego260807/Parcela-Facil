/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditCard,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  PieChart,
  ShoppingBag,
  Download,
  Info,
} from 'lucide-react';
import { Cartao, Compra, ProjecaoMes, RecomendacaoCartao, Usuario } from '../../types/finance';
import { formatarMoeda } from '../../services/installmentEngine';

interface DashboardViewProps {
  usuario: Usuario;
  cartoes: Cartao[];
  compras: Compra[];
  projecoes: ProjecaoMes[];
  melhorCartaoHoje: RecomendacaoCartao | undefined;
  curvaDivida: { mes: string; dividaRestante: number; valorMes: number }[];
  onOpenNovaCompra: () => void;
  onExportPDF: (projecao?: ProjecaoMes) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  usuario,
  cartoes,
  compras,
  projecoes,
  melhorCartaoHoje,
  curvaDivida,
  onOpenNovaCompra,
  onExportPDF,
}) => {
  const [mesesHorizonte, setMesesHorizonte] = useState<number>(6); // 3, 6 ou 12 meses
  const [selectedMesIndex, setSelectedMesIndex] = useState<number>(0);

  const mesAtual = projecoes[0] || {
    mesFormatado: 'Mês Atual',
    mesAno: '2026-10',
    totalFatura: 0,
    totalPorCartao: {},
    totalPorCategoria: {},
    parcelas: [],
  };

  const mesVisualizado = projecoes[selectedMesIndex] || mesAtual;

  // Comprometimento da Renda
  const percentualComprometimento =
    usuario.rendaMensal > 0
      ? Number(((mesAtual.totalFatura / usuario.rendaMensal) * 100).toFixed(1))
      : 0;

  const tetoAlcancado = percentualComprometimento >= usuario.tetoComprometimentoPercentual;

  // Dívida total futura
  const dividaTotalFutura = projecoes.reduce((acc, p) => acc + p.totalFatura, 0);

  // Projeção filtrada pelo horizonte selecionado
  const projecoesExibidas = projecoes.slice(0, mesesHorizonte);
  const maxFaturaValor = Math.max(...projecoesExibidas.map((p) => p.totalFatura), 100);

  // Categorias agregadas do mês visualizado
  const categoriasEntries = Object.entries(mesVisualizado.totalPorCategoria).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="space-y-6">
      {/* Banner de Recomendação Inteligente: Melhor Dia de Compra */}
      {melhorCartaoHoje && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Melhor Cartão para Comprar Hoje
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {melhorCartaoHoje.diasAteVencimento} dias até pagar
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Utilize o {melhorCartaoHoje.cartao.nome}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {melhorCartaoHoje.motivo} (Vencimento estimado:{' '}
                <strong className="text-white">{melhorCartaoHoje.dataVencimentoPrevista}</strong>).
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNovaCompra}
            className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30"
          >
            <span>Lançar Compra</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Fatura do Mês Atual */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Fatura de {mesAtual.mesFormatado}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatarMoeda(mesAtual.totalFatura)}
            </h4>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>{mesAtual.parcelas.length} parcelas ativas este mês</span>
            </p>
          </div>
        </div>

        {/* Card 2: Comprometimento da Renda */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Comprometimento da Renda
            </span>
            <div
              className={`p-2 rounded-xl ${
                tetoAlcancado ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {tetoAlcancado ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                {percentualComprometimento}%
              </h4>
              <span className="text-xs text-slate-500">
                / Teto {usuario.tetoComprometimentoPercentual}%
              </span>
            </div>
            {/* Barra de Progresso */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  tetoAlcancado ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(percentualComprometimento, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Renda mensal: {formatarMoeda(usuario.rendaMensal)}
            </p>
          </div>
        </div>

        {/* Card 3: Dívida Total Parcelada (Saldo Devedor) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Parcelado a Pagar
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatarMoeda(dividaTotalFutura)}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Distribuído em {projecoes.length} meses futuros
            </p>
          </div>
        </div>

        {/* Card 4: Cartões Cadastrados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Cartões Ativos
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
              {cartoes.length}
            </h4>
            <p className="text-xs text-slate-500 mt-1 truncate">
              Limite somado:{' '}
              {formatarMoeda(cartoes.reduce((acc, c) => acc + c.limiteTotal, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico 1: Projeção Temporal de Faturas (3, 6, 12 meses) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Projeção Temporal de Faturas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Previsão exata de desembolso mensal de parcelas no cartão
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {[3, 6, 12].map((num) => (
              <button
                key={num}
                onClick={() => setMesesHorizonte(num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mesesHorizonte === num
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {num} meses
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-3 items-end h-56 pt-6">
            {projecoesExibidas.map((proj, idx) => {
              const alturaPct = maxFaturaValor > 0 ? (proj.totalFatura / maxFaturaValor) * 100 : 0;
              const isSelected = selectedMesIndex === idx;

              return (
                <div
                  key={proj.mesAno}
                  onClick={() => setSelectedMesIndex(idx)}
                  className="flex flex-col items-center group cursor-pointer h-full justify-end"
                >
                  {/* Tooltip on hover / value */}
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-600 mb-1 opacity-80 group-hover:opacity-100 transition-opacity truncate max-w-full">
                    {formatarMoeda(proj.totalFatura)}
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end p-0.5 transition-all group-hover:bg-indigo-50">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isSelected
                          ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30'
                          : 'bg-indigo-400 group-hover:bg-indigo-500'
                      }`}
                      style={{ height: `${Math.max(alturaPct, 6)}%` }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`mt-2 text-[10px] sm:text-xs truncate transition-colors ${
                      isSelected ? 'font-bold text-indigo-600' : 'text-slate-500'
                    }`}
                  >
                    {proj.mesFormatado.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {proj.mesFormatado.split(' ')[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Month Banner */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              Mês selecionado: <strong>{mesVisualizado.mesFormatado}</strong> (Total:{' '}
              <strong className="text-indigo-600">{formatarMoeda(mesVisualizado.totalFatura)}</strong>)
            </span>
          </div>

          <button
            onClick={() => onExportPDF(mesVisualizado)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-rose-500" />
            <span>PDF Desta Fatura</span>
          </button>
        </div>
      </div>

      {/* Grid: Curva de Redução da Dívida + Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curva de Redução de Dívidas */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Curva de Redução de Dívidas</h3>
                <p className="text-xs text-slate-500">Amortização do passivo ao longo dos meses</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>

            {/* Visual list / steps */}
            <div className="mt-4 space-y-3">
              {curvaDivida.slice(0, 6).map((item, index) => {
                const totalInicial = curvaDivida[0]?.dividaRestante || 1;
                const pctRestante = (item.dividaRestante / totalInicial) * 100;

                return (
                  <div key={item.mes} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.mes}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">
                          - {formatarMoeda(item.valorMes)}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatarMoeda(item.dividaRestante)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pctRestante, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Considerando apenas as compras parceladas já registradas (sem novas compras).
          </p>
        </div>

        {/* Gastos por Categoria (Mês Selecionado) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gastos por Categoria</h3>
                <p className="text-xs text-slate-500">
                  Composição da fatura de {mesVisualizado.mesFormatado}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <PieChart className="h-4 w-4" />
              </div>
            </div>

            {categoriasEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhuma parcela cadastrada para este mês.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {categoriasEntries.map(([categoriaNome, valor]) => {
                  const pct =
                    mesVisualizado.totalFatura > 0
                      ? (valor / mesVisualizado.totalFatura) * 100
                      : 0;

                  return (
                    <div key={categoriaNome} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate pr-2">
                          {categoriaNome}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400">{pct.toFixed(0)}%</span>
                          <span className="font-semibold text-slate-900">
                            {formatarMoeda(valor)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total categorizado:</span>
            <span className="font-bold text-slate-900">
              {formatarMoeda(mesVisualizado.totalFatura)}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Parcelas que Vencem no Mês Selecionado */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Parcelas de {mesVisualizado.mesFormatado}
            </h3>
            <p className="text-xs text-slate-500">
              Detalhamento de cada parcela que compõe esta fatura
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {mesVisualizado.parcelas.length} itens
          </span>
        </div>

        {mesVisualizado.parcelas.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            Nenhuma parcela programada para este período.
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Compra</th>
                  <th className="pb-3">Cartão</th>
                  <th className="pb-3 text-center">Parcela</th>
                  <th className="pb-3">Vencimento</th>
                  <th className="pb-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mesVisualizado.parcelas.map((parc) => (
                  <tr key={parc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-medium text-slate-900 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate max-w-[180px] sm:max-w-xs">
                        {parc.compraDescricao}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{parc.cartaoNome}</td>
                    <td className="py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {parc.numeroParcela} / {parc.totalParcelas}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{parc.dataVencimentoReal}</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {formatarMoeda(parc.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
