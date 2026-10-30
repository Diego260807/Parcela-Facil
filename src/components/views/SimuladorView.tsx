/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Percent,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { Cartao, Compra, ProjecaoMes, Usuario } from '../../types/finance';
import {
  formatarMoeda,
  calcularPrimeiraFatura,
  calcularEconomiaAntecipacao,
  gerarParcelas,
} from '../../services/installmentEngine';

interface SimuladorViewProps {
  cartoes: Cartao[];
  compras: Compra[];
  projecoes: ProjecaoMes[];
  usuario: Usuario;
}

export const SimuladorView: React.FC<SimuladorViewProps> = ({
  cartoes,
  compras,
  projecoes,
  usuario,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'nova_compra' | 'antecipacao'>('nova_compra');

  // Estado do Simulador de Nova Compra
  const [simValor, setSimValor] = useState<number>(2400);
  const [simParcelas, setSimParcelas] = useState<number>(10);
  const [simCartaoId, setSimCartaoId] = useState<string>(cartoes[0]?.id || '');

  // Estado do Simulador de Antecipação
  const [antecipacaoCompraId, setAntecipacaoCompraId] = useState<string>(compras[0]?.id || '');
  const [taxaDescontoAnual, setTaxaDescontoAnual] = useState<number>(0.10); // 10% a.a.

  // Cálculos do Simulador de Nova Compra
  const cartaoSelecionado = cartoes.find((c) => c.id === simCartaoId) || cartoes[0];
  const hojeStr = new Date().toISOString().split('T')[0];

  const primeiraFaturaCalculada = cartaoSelecionado
    ? calcularPrimeiraFatura(hojeStr, cartaoSelecionado.diaFechamento, cartaoSelecionado.diaVencimento)
    : { mesAnoFatura: '2026-11', diasAteVencimento: 30, dataVencimentoReal: '2026-11-20' };

  const valorParcelaSimulada = simParcelas > 0 ? simValor / simParcelas : 0;

  // Cálculos do Simulador de Antecipação
  const compraParaAntecipar = compras.find((c) => c.id === antecipacaoCompraId);
  const cartaoCompraAntecipar = compraParaAntecipar
    ? cartoes.find((c) => c.id === compraParaAntecipar.cartaoId)
    : null;

  const parcelasCompra =
    compraParaAntecipar && cartaoCompraAntecipar
      ? gerarParcelas(compraParaAntecipar, cartaoCompraAntecipar)
      : [];

  const resultadoAntecipacao = calcularEconomiaAntecipacao(parcelasCompra, taxaDescontoAnual);

  return (
    <div className="space-y-6">
      {/* Subtab Toggle Buttons */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveSubTab('nova_compra')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSubTab === 'nova_compra'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="h-4 w-4 text-indigo-600" />
          <span>Simulador de Nova Compra ("E Se?")</span>
        </button>

        <button
          onClick={() => setActiveSubTab('antecipacao')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSubTab === 'antecipacao'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="h-4 w-4 text-emerald-600" />
          <span>Simulador de Quitação Antecipada</span>
        </button>
      </div>

      {/* ---------------- SIMULADOR 1: NOVA COMPRA ---------------- */}
      {activeSubTab === 'nova_compra' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <h4 className="text-base font-bold text-slate-900">Parâmetros da Compra Hipotética</h4>
              <p className="text-xs text-slate-500">
                Teste compras antes de passar o cartão para ver o impacto no orçamento
              </p>
            </div>

            {/* Valor total da compra */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Valor Total da Compra
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={simValor}
                  onChange={(e) => setSimValor(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quantidade de parcelas */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Quantidade de Parcelas:</span>
                <span className="text-indigo-600 font-bold text-sm">{simParcelas}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={simParcelas}
                onChange={(e) => setSimParcelas(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1x (À vista)</span>
                <span>6x</span>
                <span>12x</span>
                <span>18x</span>
                <span>24x</span>
              </div>
            </div>

            {/* Cartão de Crédito */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cartão que pretende utilizar
              </label>
              <select
                value={simCartaoId}
                onChange={(e) => setSimCartaoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {cartoes.map((cartao) => (
                  <option key={cartao.id} value={cartao.id}>
                    {cartao.nome} (Fecha dia {cartao.diaFechamento} / Vence dia {cartao.diaVencimento})
                  </option>
                ))}
              </select>
            </div>

            {/* Result callout box */}
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-indigo-900">
                <span>Valor estimado da parcela:</span>
                <strong className="text-base font-black text-indigo-600">
                  {formatarMoeda(valorParcelaSimulada)}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs text-indigo-900">
                <span>Primeira parcela em:</span>
                <span className="font-semibold text-indigo-700">
                  {primeiraFaturaCalculada.mesAnoFatura} ({primeiraFaturaCalculada.diasAteVencimento} dias)
                </span>
              </div>
            </div>
          </div>

          {/* Impact preview (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Impacto nas Faturas dos Próximos 6 Meses
              </h4>
              <p className="text-xs text-slate-500">
                Linha cinza: Fatura Atual | Barra colorida: Fatura após adicionar a compra simulada
              </p>

              <div className="mt-6 space-y-4">
                {projecoes.slice(0, 6).map((proj, idx) => {
                  const entraNesteMes = idx < simParcelas;
                  const faturaAtual = proj.totalFatura;
                  const faturaSimulada = faturaAtual + (entraNesteMes ? valorParcelaSimulada : 0);
                  const limiteCartao = cartaoSelecionado ? cartaoSelecionado.limiteTotal : 10000;
                  const excedeLimite = faturaSimulada > limiteCartao;

                  return (
                    <div key={proj.mesAno} className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{proj.mesFormatado}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through text-[11px]">
                            {formatarMoeda(faturaAtual)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span
                            className={`font-black ${
                              excedeLimite ? 'text-rose-600' : 'text-indigo-600'
                            }`}
                          >
                            {formatarMoeda(faturaSimulada)}
                          </span>
                        </div>
                      </div>

                      {/* Visual comparative bar */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-slate-400 h-full"
                          style={{
                            width: `${Math.min((faturaAtual / faturaSimulada) * 100, 100)}%`,
                          }}
                        />
                        {entraNesteMes && (
                          <div
                            className="bg-indigo-600 h-full"
                            style={{
                              width: `${Math.min(
                                (valorParcelaSimulada / faturaSimulada) * 100,
                                100
                              )}%`,
                            }}
                          />
                        )}
                      </div>

                      {excedeLimite && (
                        <p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Atenção: Ultrapassaria o limite total do cartão!
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Simulação não altera seus dados reais nem grava registros no banco.</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SIMULADOR 2: QUITAÇÃO ANTECIPADA ---------------- */}
      {activeSubTab === 'antecipacao' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Antecipar Parcelas com Desconto
              </h4>
              <p className="text-xs text-slate-500">
                Bancos digitais (como Nubank) concedem desconto sobre o valor presente das parcelas
                futuras
              </p>
            </div>

            {/* Select purchase */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Escolha a compra parcelada
              </label>
              <select
                value={antecipacaoCompraId}
                onChange={(e) => setAntecipacaoCompraId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {compras.map((compra) => (
                  <option key={compra.id} value={compra.id}>
                    {compra.descricao} ({compra.quantidadeParcelas}x de R${' '}
                    {(compra.valorTotal / compra.quantidadeParcelas).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Discount rate slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Taxa de Desconto Anual Estimada:</span>
                <span className="text-emerald-600 font-bold text-sm">
                  {(taxaDescontoAnual * 100).toFixed(1)}% a.a.
                </span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.20"
                step="0.01"
                value={taxaDescontoAnual}
                onChange={(e) => setTaxaDescontoAnual(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>4% a.a.</span>
                <span>10% a.a. (Padrão)</span>
                <span>20% a.a.</span>
              </div>
            </div>

            {/* Summary Highlights */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Valor Original Restante:</span>
                <span className="font-semibold text-slate-900">
                  {formatarMoeda(resultadoAntecipacao.totalOriginal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Valor Final a Pagar Hoje:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatarMoeda(resultadoAntecipacao.totalComDesconto)}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Sua Economia Direta:</span>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-600 block">
                    {formatarMoeda(resultadoAntecipacao.economiaTotal)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    ({resultadoAntecipacao.percentualEconomia}% de desconto)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Detalhamento Parcela a Parcela com Desconto
              </h4>
              <p className="text-xs text-slate-500">
                Quanto mais distante o vencimento da parcela, maior é o desconto composto obtido
              </p>

              <div className="overflow-x-auto mt-4 max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-2">Parcela</th>
                      <th className="pb-2">Valor Cheio</th>
                      <th className="pb-2">Valor com Desconto</th>
                      <th className="pb-2 text-right">Economia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultadoAntecipacao.detalhePorParcela.map((item) => (
                      <tr key={item.numero} className="hover:bg-slate-50">
                        <td className="py-2.5 font-semibold text-slate-700">
                          Parcela {item.numero}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {formatarMoeda(item.valorOriginal)}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-600">
                          {formatarMoeda(item.valorDescontado)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-emerald-700">
                          - {formatarMoeda(item.economia)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Limite liberado imediatamente no cartão:</span>
              <span className="font-bold text-slate-900">
                {formatarMoeda(resultadoAntecipacao.totalOriginal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
