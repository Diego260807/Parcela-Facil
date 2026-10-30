/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CreditCard as CardIcon, Plus, Calendar, AlertCircle, Sparkles, Trash2 } from 'lucide-react';
import { Cartao, Compra } from '../../types/finance';
import { formatarMoeda, calcularPrimeiraFatura } from '../../services/installmentEngine';

interface CartoesViewProps {
  cartoes: Cartao[];
  compras: Compra[];
  onOpenNovoCartao: () => void;
  onDeleteCartao: (cartaoId: string) => void;
}

export const CartoesView: React.FC<CartoesViewProps> = ({
  cartoes,
  compras,
  onOpenNovoCartao,
  onDeleteCartao,
}) => {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const hojeStr = hoje.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Seus Cartões de Crédito</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerencie múltiplos cartões, limites e acompanhe as melhores datas de fechamento
          </p>
        </div>

        <button
          onClick={onOpenNovoCartao}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Novo Cartão</span>
        </button>
      </div>

      {/* Grid of Credit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cartoes.map((cartao) => {
          // Calcula o total comprometido com parcelas futuras neste cartão
          const comprasDesteCartao = compras.filter((c) => c.cartaoId === cartao.id);
          const totalComprometido = comprasDesteCartao.reduce((acc, c) => acc + c.valorTotal, 0);
          const limiteDisponivel = Math.max(0, cartao.limiteTotal - totalComprometido);
          const pctUtilizado = Math.min(
            100,
            Number(((totalComprometido / cartao.limiteTotal) * 100).toFixed(1))
          );

          // Ciclo de fatura
          const faturaJaFechou = diaHoje >= cartao.diaFechamento;
          const calcPrazo = calcularPrimeiraFatura(hojeStr, cartao.diaFechamento, cartao.diaVencimento);

          return (
            <div
              key={cartao.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Visual Realistic Credit Card */}
                <div
                  className="w-full aspect-[1.586] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.01]"
                  style={{
                    background: `linear-gradient(135deg, ${cartao.corHex} 0%, #0F172A 100%)`,
                  }}
                >
                  {/* Subtle background circles */}
                  <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
                  <div className="absolute right-4 bottom-4 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

                  {/* Card Header: Bank & Contactless chip */}
                  <div className="flex items-center justify-between z-10">
                    <div>
                      <span className="text-[10px] tracking-wider uppercase opacity-75 font-semibold">
                        {cartao.banco}
                      </span>
                      <h4 className="text-base font-bold tracking-tight">{cartao.nome}</h4>
                    </div>

                    {/* EMV Chip */}
                    <div className="w-9 h-7 rounded-md bg-amber-300/80 border border-amber-400/60 shadow-inner flex items-center justify-center">
                      <div className="w-5 h-4 border border-amber-700/30 rounded-xs" />
                    </div>
                  </div>

                  {/* Card Middle: Card number preview */}
                  <div className="z-10 tracking-widest text-sm font-mono opacity-90">
                    •••• •••• •••• {cartao.ultimosDigitos}
                  </div>

                  {/* Card Bottom: Closing / Due dates & Brand */}
                  <div className="flex items-end justify-between z-10">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider opacity-75 block">
                        Fechamento / Vencimento
                      </span>
                      <span className="text-xs font-semibold">
                        Dia {cartao.diaFechamento} / Dia {cartao.diaVencimento}
                      </span>
                    </div>

                    <span className="text-sm font-bold uppercase tracking-wider italic opacity-90">
                      {cartao.bandeira}
                    </span>
                  </div>
                </div>

                {/* Best purchase day status indicator */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  {faturaJaFechou ? (
                    <div className="flex items-start gap-2 text-emerald-800">
                      <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-700 font-semibold block">
                          Melhor momento para comprar!
                        </strong>
                        <span>
                          Fatura deste mês fechou dia {cartao.diaFechamento}. Comprando hoje você tem{' '}
                          <strong>{calcPrazo.diasAteVencimento} dias</strong> até o pagamento!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block">Fatura em aberto</span>
                        <span>
                          Fecha em {cartao.diaFechamento - diaHoje} dias (dia {cartao.diaFechamento}
                          ). Vence dia {cartao.diaVencimento}.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Limits & Usage Bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Limite Utilizado ({pctUtilizado}%)</span>
                    <span className="font-semibold text-slate-800">
                      {formatarMoeda(totalComprometido)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pctUtilizado > 80
                          ? 'bg-rose-500'
                          : pctUtilizado > 50
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pctUtilizado}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Limite Disponível:</span>
                    <span className="font-bold text-emerald-600">
                      {formatarMoeda(limiteDisponivel)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Limite Total:</span>
                    <span className="font-medium text-slate-700">
                      {formatarMoeda(cartao.limiteTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Delete action */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {comprasDesteCartao.length} compras vinculadas
                </span>

                <button
                  onClick={() => onDeleteCartao(cartao.id)}
                  title="Excluir Cartão"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
