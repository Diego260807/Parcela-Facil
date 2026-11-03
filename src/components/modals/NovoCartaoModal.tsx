/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, CreditCard, Check } from 'lucide-react';
import { BandeiraCartao, Cartao } from '../../types/finance';

interface NovoCartaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvarCartao: (novoCartao: Omit<Cartao, 'id'>) => void;
}

const PALETTE_COLORS = [
  '#820AD1', // Nubank Roxo
  '#EA580C', // Itaú Laranja
  '#0F172A', // XP Preto
  '#0284C7', // Azul Claro
  '#16A34A', // Verde
  '#DC2626', // Santander Vermelho
  '#B45309', // Dourado
  '#4338CA', // Indigo
];

export const NovoCartaoModal: React.FC<NovoCartaoModalProps> = ({
  isOpen,
  onClose,
  onSalvarCartao,
}) => {
  const [nome, setNome] = useState('');
  const [banco, setBanco] = useState('Nubank');
  const [ultimosDigitos, setUltimosDigitos] = useState('');
  const [bandeira, setBandeira] = useState<BandeiraCartao>('mastercard');
  const [limiteTotal, setLimiteTotal] = useState<number>(5000);
  const [diaFechamento, setDiaFechamento] = useState<number>(20);
  const [diaVencimento, setDiaVencimento] = useState<number>(27);
  const [corHex, setCorHex] = useState(PALETTE_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || limiteTotal <= 0) return;

    onSalvarCartao({
      nome,
      banco,
      ultimosDigitos: ultimosDigitos.padStart(4, '0').slice(-4),
      bandeira,
      limiteTotal: Number(limiteTotal),
      diaFechamento: Number(diaFechamento),
      diaVencimento: Number(diaVencimento),
      corHex,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cadastrar Cartão</h3>
              <p className="text-xs text-slate-500">
                Configure limites e datas de fechamento para cálculo inteligente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Cartão *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank Roxinho, Itaú Click"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banco Emissor
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Inter"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Últimos 4 Dígitos
              </label>
              <input
                type="text"
                maxLength={4}
                required
                placeholder="Ex: 8821"
                value={ultimosDigitos}
                onChange={(e) => setUltimosDigitos(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bandeira
              </label>
              <select
                value={bandeira}
                onChange={(e) => setBandeira(e.target.value as BandeiraCartao)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Limite Total (R$) *
              </label>
              <input
                type="number"
                step="100"
                min="100"
                required
                value={limiteTotal}
                onChange={(e) => setLimiteTotal(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Fechamento & Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dia de Fechamento *
              </label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[10px] text-slate-400">Gera o "Melhor dia"</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dia de Vencimento *
              </label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[10px] text-slate-400">Data de pagamento</span>
            </div>
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cor do Cartão Visual
            </label>
            <div className="flex items-center gap-2">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCorHex(c)}
                  className="h-7 w-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: c }}
                >
                  {corHex === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
