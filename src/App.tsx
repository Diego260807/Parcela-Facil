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
import { DetalhesFaturaModal } from './components/modals/DetalhesFaturaModal';
import { AuthView } from './components/auth/AuthView';
import { INITIAL_CATEGORIES } from './data/mockData';
import { Cartao, Compra, ProjecaoMes, Usuario } from './types/finance';
import {
  calcularProjecaoMensal,
  calcularCurvaReducaoDivida,
  obterMelhorCartaoParaHoje,
} from './services/installmentEngine';
import { exportarRelatorioExcel, exportarFaturaPDF } from './services/exportService';
import {
  carregarCartoesDoUsuario,
  carregarComprasDoUsuario,
  fazerLogout,
  obterSessaoAtiva,
  salvarCartoesDoUsuario,
  salvarComprasDoUsuario,
} from './services/authService';

export default function App() {
  // Authentication State
  const [usuarioAtivo, setUsuarioAtivo] = useState<Usuario | null>(() => obterSessaoAtiva());

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Categories (System global)
  const [categorias] = useState(INITIAL_CATEGORIES);

  // Entities State isolated by User ID
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);

  // Modals state
  const [isNovaCompraOpen, setIsNovaCompraOpen] = useState(false);
  const [novaCompraInitialMode, setNovaCompraInitialMode] = useState<'manual' | 'ocr'>('manual');
  const [isNovoCartaoOpen, setIsNovoCartaoOpen] = useState(false);
  const [mesFaturaAberta, setMesFaturaAberta] = useState<string | null>(null);

  // Load user data whenever active user changes
  useEffect(() => {
    if (usuarioAtivo) {
      const cards = carregarCartoesDoUsuario(usuarioAtivo.id);
      const purchases = carregarComprasDoUsuario(usuarioAtivo.id);
      setCartoes(cards);
      setCompras(purchases);
    } else {
      setCartoes([]);
      setCompras([]);
    }
  }, [usuarioAtivo]);

  // Persist cards whenever updated
  useEffect(() => {
    if (usuarioAtivo && cartoes.length >= 0) {
      salvarCartoesDoUsuario(usuarioAtivo.id, cartoes);
    }
  }, [cartoes, usuarioAtivo]);

  // Persist purchases whenever updated
  useEffect(() => {
    if (usuarioAtivo && compras.length >= 0) {
      salvarComprasDoUsuario(usuarioAtivo.id, compras);
    }
  }, [compras, usuarioAtivo]);

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

  // Auth Handlers
  const handleLoginSucesso = (usuario: Usuario) => {
    setUsuarioAtivo(usuario);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      fazerLogout();
      setUsuarioAtivo(null);
    }
  };

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

  // If user is not logged in, render the Auth View
  if (!usuarioAtivo) {
    return <AuthView onLoginSucesso={handleLoginSucesso} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        usuario={usuarioAtivo}
        onLogout={handleLogout}
        onOpenNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
        onExportExcel={handleExportExcel}
        onExportPDF={() => handleExportPDF()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          usuario={usuarioAtivo}
          onLogout={handleLogout}
          onOpenNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
          onOpenNovoCartao={() => setIsNovoCartaoOpen(true)}
          onExportExcel={handleExportExcel}
          onExportPDF={() => handleExportPDF()}
          melhorCartaoHoje={melhorCartaoHoje}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              usuario={usuarioAtivo}
              cartoes={cartoes}
              compras={compras}
              projecoes={projecoes}
              melhorCartaoHoje={melhorCartaoHoje}
              curvaDivida={curvaDivida}
              onOpenNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
              onExportPDF={handleExportPDF}
              onVerFatura={(mesAno) => setMesFaturaAberta(mesAno)}
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
              usuario={usuarioAtivo}
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

      {/* Interactive Invoice Details Modal */}
      <DetalhesFaturaModal
        isOpen={!!mesFaturaAberta}
        onClose={() => setMesFaturaAberta(null)}
        mesAnoSelecionado={mesFaturaAberta || projecoes[0]?.mesAno || '2026-11'}
        projecoes={projecoes}
        cartoes={cartoes}
        onExportarPDF={handleExportPDF}
        onTrocarMes={(novoMesAno) => setMesFaturaAberta(novoMesAno)}
        onNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
      />
    </div>
  );
}
