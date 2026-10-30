/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/views/DashboardView';
import { CartoesView } from './components/views/CartoesView';
import { ComprasView } from './components/views/ComprasView';
import { SimuladorView } from './components/views/SimuladorView';
import { NovaCompraModal } from './components/modals/NovaCompraModal';
import { NovoCartaoModal } from './components/modals/NovoCartaoModal';
import { EspecificacaoModal } from './components/modals/EspecificacaoModal';
import {
  INITIAL_CARDS,
  INITIAL_CATEGORIES,
  INITIAL_PURCHASES,
  INITIAL_USER,
} from './data/mockData';
import { Cartao, Compra, ProjecaoMes, Usuario } from './types/finance';
import {
  calcularProjecaoMensal,
  calcularCurvaReducaoDivida,
  obterMelhorCartaoParaHoje,
} from './services/installmentEngine';
import { exportarRelatorioExcel, exportarFaturaPDF } from './services/exportService';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Entities State with LocalStorage Persistence
  const [usuario] = useState<Usuario>(INITIAL_USER);
  const [categorias] = useState(INITIAL_CATEGORIES);

  const [cartoes, setCartoes] = useState<Cartao[]>(() => {
    const saved = localStorage.getItem('pf_cartoes');
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [compras, setCompras] = useState<Compra[]>(() => {
    const saved = localStorage.getItem('pf_compras');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  // Modals state
  const [isNovaCompraOpen, setIsNovaCompraOpen] = useState(false);
  const [novaCompraInitialMode, setNovaCompraInitialMode] = useState<'manual' | 'ocr'>('manual');
  const [isNovoCartaoOpen, setIsNovoCartaoOpen] = useState(false);
  const [isEspecificacaoOpen, setIsEspecificacaoOpen] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('pf_cartoes', JSON.stringify(cartoes));
  }, [cartoes]);

  useEffect(() => {
    localStorage.setItem('pf_compras', JSON.stringify(compras));
  }, [compras]);

  // Financial Calculations via Core Engine
  const projecoes: ProjecaoMes[] = useMemo(() => {
    return calcularProjecaoMensal(cartoes, compras, 12);
  }, [cartoes, compras]);

  const curvaDivida = useMemo(() => {
    return calcularCurvaReducaoDivida(projecoes);
  }, [projecoes]);

  const recomendacoesCartao = useMemo(() => {
    return obterMelhorCartaoParaHoje(cartoes);
  }, [cartoes]);

  const melhorCartaoHoje = recomendacoesCartao[0];

  // Handlers for Add/Delete
  const handleSalvarCompra = (novaCompra: Omit<Compra, 'id' | 'criadoEm'>) => {
    const compraCriada: Compra = {
      ...novaCompra,
      id: `compra-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    setCompras((prev) => [compraCriada, ...prev]);
  };

  const handleDeleteCompra = (compraId: string) => {
    if (confirm('Deseja realmente remover esta compra e suas respectivas parcelas?')) {
      setCompras((prev) => prev.filter((c) => c.id !== compraId));
    }
  };

  const handleSalvarCartao = (novoCartao: Omit<Cartao, 'id'>) => {
    const cartaoCriado: Cartao = {
      ...novoCartao,
      id: `card-${Date.now()}`,
    };
    setCartoes((prev) => [...prev, cartaoCriado]);
  };

  const handleDeleteCartao = (cartaoId: string) => {
    if (confirm('Deseja realmente remover este cartão? As compras associadas serão mantidas.')) {
      setCartoes((prev) => prev.filter((c) => c.id !== cartaoId));
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    exportarRelatorioExcel(cartoes, compras, projecoes);
  };

  const handleExportPDF = (projecaoAlvo?: ProjecaoMes) => {
    const proj = projecaoAlvo || projecoes[0];
    if (proj) {
      exportarFaturaPDF(proj, cartoes);
    }
  };

  const handleOpenNovaCompraWithMode = (mode: 'manual' | 'ocr' = 'manual') => {
    setNovaCompraInitialMode(mode);
    setIsNovaCompraOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
        onOpenEspecificacao={() => setIsEspecificacaoOpen(true)}
        onExportExcel={handleExportExcel}
        onExportPDF={() => handleExportPDF()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          onOpenNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
          onOpenNovoCartao={() => setIsNovoCartaoOpen(true)}
          onOpenEspecificacao={() => setIsEspecificacaoOpen(true)}
          onExportExcel={handleExportExcel}
          onExportPDF={() => handleExportPDF()}
          melhorCartaoHoje={melhorCartaoHoje}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              usuario={usuario}
              cartoes={cartoes}
              compras={compras}
              projecoes={projecoes}
              melhorCartaoHoje={melhorCartaoHoje}
              curvaDivida={curvaDivida}
              onOpenNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
              onExportPDF={handleExportPDF}
            />
          )}

          {activeTab === 'cartoes' && (
            <CartoesView
              cartoes={cartoes}
              compras={compras}
              onOpenNovoCartao={() => setIsNovoCartaoOpen(true)}
              onDeleteCartao={handleDeleteCartao}
            />
          )}

          {activeTab === 'compras' && (
            <ComprasView
              compras={compras}
              cartoes={cartoes}
              categorias={categorias}
              onOpenNovaCompra={handleOpenNovaCompraWithMode}
              onDeleteCompra={handleDeleteCompra}
            />
          )}

          {activeTab === 'simulador' && (
            <SimuladorView
              cartoes={cartoes}
              compras={compras}
              projecoes={projecoes}
              usuario={usuario}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <NovaCompraModal
        isOpen={isNovaCompraOpen}
        onClose={() => setIsNovaCompraOpen(false)}
        cartoes={cartoes}
        categorias={categorias}
        onSalvarCompra={handleSalvarCompra}
        initialMode={novaCompraInitialMode}
      />

      <NovoCartaoModal
        isOpen={isNovoCartaoOpen}
        onClose={() => setIsNovoCartaoOpen(false)}
        onSalvarCartao={handleSalvarCartao}
      />

      <EspecificacaoModal
        isOpen={isEspecificacaoOpen}
        onClose={() => setIsEspecificacaoOpen(false)}
      />
    </div>
  );
}
