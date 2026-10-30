/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Plus, FileSpreadsheet, FileText, Sparkles, CreditCard, Code2 } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { RecomendacaoCartao } from '../types/finance';

interface HeaderProps {
  activeTab: ActiveTab;
  setMobileOpen: (open: boolean) => void;
  onOpenNovaCompra: () => void;
  onOpenNovoCartao: () => void;
  onOpenEspecificacao: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  melhorCartaoHoje?: RecomendacaoCartao;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setMobileOpen,
  onOpenNovaCompra,
  onOpenNovoCartao,
  onOpenEspecificacao,
  onExportExcel,
  onExportPDF,
  melhorCartaoHoje,
}) => {
  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Financeiro',
      subtitle: 'Acompanhe parcelas ativas, faturas e projeção futura de gastos.',
    },
    cartoes: {
      title: 'Gestão de Cartões',
      subtitle: 'Controle de limites, datas de fechamento e melhor dia para comprar.',
    },
    compras: {
      title: 'Minhas Compras',
      subtitle: 'Histórico de lançamentos parcelados e leitura inteligente de comprovantes.',
    },
    simulador: {
      title: 'Simulador Financeiro ("E Se?")',
      subtitle: 'Preveja o impacto de novas compras ou calcule a economia de antecipação.',
    },
  };

  const current = titles[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-4 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {current.title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Best card pill badge if available */}
          {melhorCartaoHoje && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Hoje compre com <strong>{melhorCartaoHoje.cartao.nome}</strong> (
                {melhorCartaoHoje.diasAteVencimento} dias até pagar)
              </span>
            </div>
          )}

          {/* Quick Excel export button */}
          <button
            onClick={onExportExcel}
            title="Exportar para Excel (.xlsx)"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden lg:inline">Excel</span>
          </button>

          {/* Quick PDF export button */}
          <button
            onClick={onExportPDF}
            title="Exportar Fatura em PDF"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <FileText className="h-4 w-4 text-rose-600" />
            <span className="hidden lg:inline">Fatura PDF</span>
          </button>

          {/* Docs / Specification shortcut */}
          <button
            onClick={onOpenEspecificacao}
            title="Ver Especificação Técnica & DDL"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-all active:scale-95"
          >
            <Code2 className="h-4 w-4 text-indigo-600" />
            <span className="hidden xl:inline">Arquitetura</span>
          </button>

          {activeTab === 'cartoes' ? (
            <button
              onClick={onOpenNovoCartao}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <CreditCard className="h-4 w-4" />
              <span>Novo Cartão</span>
            </button>
          ) : (
            <button
              onClick={onOpenNovaCompra}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Compra</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
