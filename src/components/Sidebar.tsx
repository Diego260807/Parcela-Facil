/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShoppingBag,
  Calculator,
  FileSpreadsheet,
  FileText,
  Code2,
  X,
  PlusCircle,
  Sparkles,
  LogOut,
  Layers,
} from 'lucide-react';
import { Usuario } from '../types/finance';
import { formatarMoeda } from '../services/installmentEngine';

export type ActiveTab = 'dashboard' | 'cartoes' | 'compras' | 'simulador';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  usuario: Usuario;
  onLogout: () => void;
  onOpenNovaCompra: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  usuario,
  onLogout,
  onOpenNovaCompra,
  onExportExcel,
  onExportPDF,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Geral',
    },
    {
      id: 'cartoes' as ActiveTab,
      label: 'Cartões',
      icon: CreditCard,
      badge: 'Melhor Dia',
    },
    {
      id: 'compras' as ActiveTab,
      label: 'Compras',
      icon: ShoppingBag,
      badge: 'OCR & Manual',
    },
    {
      id: 'simulador' as ActiveTab,
      label: 'Simulador ("E Se?")',
      icon: Calculator,
      badge: 'Antecipação',
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Branding */}
        <div>
          <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  Parcela<span className="text-emerald-400">Fácil</span>
                </h1>
                <p className="text-xs text-slate-400">Gestão de Parcelas & Faturas</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action Button: Nova Compra */}
          <div className="p-4">
            <button
              onClick={() => {
                onOpenNovaCompra();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-900/30 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nova Compra</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-900/80 text-indigo-200 border border-indigo-400/30 ml-auto">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-emerald-300" />
                + IA
              </span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1 mt-1">
            <p className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Navegação Principal
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-indigo-500/30 text-indigo-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Reports Section */}
          <div className="px-3 mt-6">
            <p className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Exportação & Relatórios
            </p>
            <div className="space-y-1">
              <button
                onClick={onExportExcel}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30 rounded-lg transition-colors group"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Exportar Planilha Excel (.xlsx)</span>
              </button>
              <button
                onClick={onExportPDF}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-slate-300 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors group"
              >
                <FileText className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Gerar Fatura em PDF (.pdf)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                style={{ backgroundColor: usuario.avatarCor || '#6366F1' }}
              >
                {usuario.nome
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{usuario.nome}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  Renda: {formatarMoeda(usuario.rendaMensal)}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sair da Conta (Logout)"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
