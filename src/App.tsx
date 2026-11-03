
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

import {
  exportarRelatorioExcel,
  exportarFaturaPDF,
} from './services/exportService';

import {
  carregarCartoesDoUsuario,
  carregarComprasDoUsuario,
  fazerLogout,
  obterSessaoAtiva,
  salvarCartoesDoUsuario,
  salvarComprasDoUsuario,
} from './services/authService';

import {
  carregarPagamentosDoUsuario,
  marcarParcelaComoPaga,
  desfazerPagamentoParcela,
  PagamentoParcela,
} from './services/paymentService';

export default function App() {
  // Authentication State
  const [usuarioAtivo, setUsuarioAtivo] = useState<Usuario | null>(
    () => obterSessaoAtiva()
  );

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Categories
  const [categorias] = useState(INITIAL_CATEGORIES);

  // User data
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoParcela[]>([]);

  // Identifies which user owns the data currently loaded.
  const [dadosCarregadosParaUsuario, setDadosCarregadosParaUsuario] =
    useState<string | null>(null);

  // Modals state
  const [isNovaCompraOpen, setIsNovaCompraOpen] = useState(false);
  const [novaCompraInitialMode, setNovaCompraInitialMode] =
    useState<'manual' | 'ocr'>('manual');
  const [isNovoCartaoOpen, setIsNovoCartaoOpen] = useState(false);
  const [mesFaturaAberta, setMesFaturaAberta] = useState<string | null>(null);

  // Load data whenever the active user changes.
  useEffect(() => {
    if (!usuarioAtivo) {
      setDadosCarregadosParaUsuario(null);
      setCartoes([]);
      setCompras([]);
      setPagamentos([]);
      return;
    }

    const userId = usuarioAtivo.id;

    // Prevent saving data before the new user's information is loaded.
    setDadosCarregadosParaUsuario(null);

    const cards = carregarCartoesDoUsuario(userId);
    const purchases = carregarComprasDoUsuario(userId);
    const payments = carregarPagamentosDoUsuario(userId);

    setCartoes(cards);
    setCompras(purchases);
    setPagamentos(payments);

    setDadosCarregadosParaUsuario(userId);
  }, [usuarioAtivo]);

  // Persist cards.
  useEffect(() => {
    if (!usuarioAtivo || dadosCarregadosParaUsuario !== usuarioAtivo.id) {
      return;
    }

    salvarCartoesDoUsuario(usuarioAtivo.id, cartoes);
  }, [cartoes, usuarioAtivo, dadosCarregadosParaUsuario]);

  // Persist purchases.
  useEffect(() => {
    if (!usuarioAtivo || dadosCarregadosParaUsuario !== usuarioAtivo.id) {
      return;
    }

    salvarComprasDoUsuario(usuarioAtivo.id, compras);
  }, [compras, usuarioAtivo, dadosCarregadosParaUsuario]);

  // Financial calculations.
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

  // Authentication handlers.
  const handleLoginSucesso = (usuario: Usuario) => {
    setUsuarioAtivo(usuario);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      fazerLogout();
      setUsuarioAtivo(null);
      setActiveTab('dashboard');
    }
  };

  // Payment handlers.
  const handleMarcarParcelaPaga = (
    compraId: string,
    numeroParcela: number,
    valor: number
  ) => {
    if (!usuarioAtivo) return;

    const hoje = new Date();

    const dataPagamento = [
      hoje.getFullYear(),
      String(hoje.getMonth() + 1).padStart(2, '0'),
      String(hoje.getDate()).padStart(2, '0'),
    ].join('-');

    const atualizados = marcarParcelaComoPaga(
      usuarioAtivo.id,
      compraId,
      numeroParcela,
      valor,
      dataPagamento
    );

    setPagamentos(atualizados);
  };

  const handleDesfazerPagamento = (
    compraId: string,
    numeroParcela: number
  ) => {
    if (!usuarioAtivo) return;

    const atualizados = desfazerPagamentoParcela(
      usuarioAtivo.id,
      compraId,
      numeroParcela
    );

    setPagamentos(atualizados);
  };

  // Purchase handlers.
  const handleSalvarCompra = (
    novaCompra: Omit<Compra, 'id' | 'criadoEm'>
  ) => {
    const compraCriada: Compra = {
      ...novaCompra,
      id: `compra-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };

    setCompras((prev) => [compraCriada, ...prev]);
  };

  const handleDeleteCompra = (compraId: string) => {
    if (
      confirm(
        'Deseja realmente remover esta compra e suas respectivas parcelas?'
      )
    ) {
      setCompras((prev) => prev.filter((c) => c.id !== compraId));
    }
  };

  // Card handlers.
  const handleSalvarCartao = (novoCartao: Omit<Cartao, 'id'>) => {
    const cartaoCriado: Cartao = {
      ...novoCartao,
      id: `card-${Date.now()}`,
    };

    setCartoes((prev) => [...prev, cartaoCriado]);
  };

  const handleDeleteCartao = (cartaoId: string) => {
    if (
      confirm(
        'Deseja realmente remover este cartão? As compras associadas serão mantidas.'
      )
    ) {
      setCartoes((prev) => prev.filter((c) => c.id !== cartaoId));
    }
  };

  // Export handlers.
  const handleExportExcel = () => {
    exportarRelatorioExcel(cartoes, compras, projecoes);
  };

  const handleExportPDF = (projecaoAlvo?: ProjecaoMes) => {
    const proj = projecaoAlvo || projecoes[0];

    if (proj) {
      exportarFaturaPDF(proj, cartoes);
    }
  };

  const handleOpenNovaCompraWithMode = (
    mode: 'manual' | 'ocr' = 'manual'
  ) => {
    setNovaCompraInitialMode(mode);
    setIsNovaCompraOpen(true);
  };

  // Authentication screen.
  if (!usuarioAtivo) {
    return <AuthView onLoginSucesso={handleLoginSucesso} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-indigo-500 selection:text-white">
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

      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              usuario={usuarioAtivo}
              cartoes={cartoes}
              compras={compras}
              projecoes={projecoes}
              pagamentos={pagamentos}
              melhorCartaoHoje={melhorCartaoHoje}
              curvaDivida={curvaDivida}
              onOpenNovaCompra={() =>
                handleOpenNovaCompraWithMode('manual')
              }
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
              pagamentos={pagamentos}
            />
          )}
        </main>
      </div>

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

      <DetalhesFaturaModal
        isOpen={!!mesFaturaAberta}
        onClose={() => setMesFaturaAberta(null)}
        mesAnoSelecionado={
          mesFaturaAberta || projecoes[0]?.mesAno || '2026-11'
        }
        projecoes={projecoes}
        cartoes={cartoes}
        pagamentos={pagamentos}
        onMarcarParcelaPaga={handleMarcarParcelaPaga}
        onDesfazerPagamento={handleDesfazerPagamento}
        onExportarPDF={handleExportPDF}
        onTrocarMes={(novoMesAno) => setMesFaturaAberta(novoMesAno)}
        onNovaCompra={() => handleOpenNovaCompraWithMode('manual')}
      />
    </div>
  );
}
