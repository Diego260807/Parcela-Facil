
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { LayoutDashboard, Settings, LogOut, CreditCard } from 'lucide-react';
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
  // ----------------- AUTENTICAÇÃO -----------------

  const [usuarioAtivo, setUsuarioAtivo] = useState<Usuario | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [erroSessao, setErroSessao] = useState<string | null>(null);

  // Verifica se já existe uma sessão válida no Supabase.
  useEffect(() => {
    let componenteAtivo = true;

    const verificarSessao = async () => {
      try {
        const usuario = await obterSessaoAtiva();

        if (componenteAtivo) {
          setUsuarioAtivo(usuario);
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);

        if (componenteAtivo) {
          setErroSessao(
            'Não foi possível verificar sua sessão. Atualize a página e tente novamente.'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoSessao(false);
        }
      }
    };

    verificarSessao();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  // ----------------- NAVEGAÇÃO -----------------

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // ----------------- CATEGORIAS -----------------

  const [categorias] = useState(INITIAL_CATEGORIES);

  // ----------------- DADOS DO USUÁRIO -----------------

  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoParcela[]>([]);

  // Indica para qual usuário os dados já foram carregados.
  const [dadosCarregadosParaUsuario, setDadosCarregadosParaUsuario] =
    useState<string | null>(null);

  const [carregandoDados, setCarregandoDados] = useState(false);
  const [erroDados, setErroDados] = useState<string | null>(null);

  // ----------------- MODAIS -----------------

  const [isNovaCompraOpen, setIsNovaCompraOpen] = useState(false);

  const [novaCompraInitialMode, setNovaCompraInitialMode] =
    useState<'manual' | 'ocr'>('manual');

  const [isNovoCartaoOpen, setIsNovoCartaoOpen] = useState(false);
  const [mesFaturaAberta, setMesFaturaAberta] = useState<string | null>(null);

  // ----------------- CARREGAMENTO DOS DADOS -----------------

  useEffect(() => {
    if (!usuarioAtivo) {
      setDadosCarregadosParaUsuario(null);
      setCartoes([]);
      setCompras([]);
      setPagamentos([]);
      setCarregandoDados(false);
      setErroDados(null);
      return;
    }

    let componenteAtivo = true;
    const userId = usuarioAtivo.id;

    const carregarDados = async () => {
      setDadosCarregadosParaUsuario(null);
      setCarregandoDados(true);
      setErroDados(null);

      try {
        const [cards, purchases, payments] = await Promise.all([
          carregarCartoesDoUsuario(userId),
          carregarComprasDoUsuario(userId),
          carregarPagamentosDoUsuario(userId),
        ]);

        if (!componenteAtivo) return;

        setCartoes(cards);
        setCompras(purchases);
        setPagamentos(payments);

        // Só libera a gravação depois que todos os dados chegaram.
        setDadosCarregadosParaUsuario(userId);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);

        if (componenteAtivo) {
          setErroDados(
            'Não foi possível carregar seus dados. Verifique sua conexão e atualize a página.'
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoDados(false);
        }
      }
    };

    carregarDados();

    return () => {
      componenteAtivo = false;
    };
  }, [usuarioAtivo]);

  // ----------------- SALVAR CARTÕES -----------------

  useEffect(() => {
    if (
      !usuarioAtivo ||
      dadosCarregadosParaUsuario !== usuarioAtivo.id
    ) {
      return;
    }

    const salvar = async () => {
      try {
        await salvarCartoesDoUsuario(usuarioAtivo.id, cartoes);
      } catch (error) {
        console.error('Erro ao salvar cartões:', error);
        setErroDados('Não foi possível salvar as alterações dos cartões.');
      }
    };

    salvar();
  }, [cartoes, usuarioAtivo, dadosCarregadosParaUsuario]);

  // ----------------- SALVAR COMPRAS -----------------

  useEffect(() => {
    if (
      !usuarioAtivo ||
      dadosCarregadosParaUsuario !== usuarioAtivo.id
    ) {
      return;
    }

    const salvar = async () => {
      try {
        await salvarComprasDoUsuario(usuarioAtivo.id, compras);
      } catch (error) {
        console.error('Erro ao salvar compras:', error);
        setErroDados('Não foi possível salvar as alterações das compras.');
      }
    };

    salvar();
  }, [compras, usuarioAtivo, dadosCarregadosParaUsuario]);

  // ----------------- CÁLCULOS FINANCEIROS -----------------

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

  // ----------------- LOGIN E LOGOUT -----------------

  const handleLoginSucesso = (usuario: Usuario) => {
    setErroSessao(null);
    setErroDados(null);
    setUsuarioAtivo(usuario);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (!confirm('Deseja realmente sair da sua conta?')) {
      return;
    }

    try {
      await fazerLogout();

      setUsuarioAtivo(null);
      setDadosCarregadosParaUsuario(null);
      setCartoes([]);
      setCompras([]);
      setPagamentos([]);
      setActiveTab('dashboard');
      setErroDados(null);
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
      alert('Não foi possível sair da conta. Tente novamente.');
    }
  };

  // ----------------- PAGAMENTOS -----------------

  const handleMarcarParcelaPaga = async (
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

    try {
      const atualizados = await marcarParcelaComoPaga(
        usuarioAtivo.id,
        compraId,
        numeroParcela,
        valor,
        dataPagamento
      );

      setPagamentos(atualizados);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      alert('Não foi possível registrar o pagamento.');
    }
  };

  const handleDesfazerPagamento = async (
    compraId: string,
    numeroParcela: number
  ) => {
    if (!usuarioAtivo) return;

    try {
      const atualizados = await desfazerPagamentoParcela(
        usuarioAtivo.id,
        compraId,
        numeroParcela
      );

      setPagamentos(atualizados);
    } catch (error) {
      console.error('Erro ao desfazer pagamento:', error);
      alert('Não foi possível desfazer o pagamento.');
    }
  };

  // ----------------- COMPRAS -----------------

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
      setCompras((prev) => prev.filter((compra) => compra.id !== compraId));
    }
  };

  // ----------------- CARTÕES -----------------

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
      setCartoes((prev) => prev.filter((cartao) => cartao.id !== cartaoId));
    }
  };

  // ----------------- EXPORTAÇÕES -----------------

  const handleExportExcel = () => {
    exportarRelatorioExcel(cartoes, compras, projecoes);
  };

  const handleExportPDF = (projecaoAlvo?: ProjecaoMes) => {
    const proj = projecaoAlvo || projecoes[0];

    if (proj) {
      exportarFaturaPDF(proj, cartoes);
    }
  };

  // ----------------- ABRIR NOVA COMPRA -----------------

  const handleOpenNovaCompraWithMode = (
    mode: 'manual' | 'ocr' = 'manual'
  ) => {
    setNovaCompraInitialMode(mode);
    setIsNovaCompraOpen(true);
  };

  // ----------------- TELAS DE CARREGAMENTO -----------------

  if (carregandoSessao) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <CreditCard className="h-10 w-10 text-indigo-400 mb-4" />
        <p className="text-sm text-slate-300">
          Verificando sua sessão...
        </p>
      </div>
    );
  }

  if (erroSessao && !usuarioAtivo) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
        <p className="text-sm text-rose-300 mb-4">{erroSessao}</p>

        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // ----------------- TELA DE AUTENTICAÇÃO -----------------

  if (!usuarioAtivo) {
    return <AuthView onLoginSucesso={handleLoginSucesso} />;
  }

  // ----------------- CARREGAMENTO DOS DADOS -----------------

  if (carregandoDados || dadosCarregadosParaUsuario !== usuarioAtivo.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700">
        <CreditCard className="h-10 w-10 text-indigo-600 mb-4" />
        <p className="text-sm font-medium">
          Carregando seus dados financeiros...
        </p>
      </div>
    );
  }

  // ----------------- APLICATIVO -----------------

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased selection:bg-indigo-500 selection:text-white">

      {erroDados && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm rounded-xl border border-rose-200 bg-white p-4 shadow-lg">
          <p className="text-sm text-rose-700">{erroDados}</p>

          <button
            onClick={() => setErroDados(null)}
            className="mt-2 text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Fechar
          </button>
        </div>
      )}

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

      {/* Modal de nova compra */}
      <NovaCompraModal
        isOpen={isNovaCompraOpen}
        onClose={() => setIsNovaCompraOpen(false)}
        cartoes={cartoes}
        categorias={categorias}
        onSalvarCompra={handleSalvarCompra}
        initialMode={novaCompraInitialMode}
      />

      {/* Modal de novo cartão */}
      <NovoCartaoModal
        isOpen={isNovoCartaoOpen}
        onClose={() => setIsNovoCartaoOpen(false)}
        onSalvarCartao={handleSalvarCartao}
      />

      {/* Modal de detalhes da fatura */}
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
