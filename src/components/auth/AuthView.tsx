
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreditCard,
  Lock,
  Mail,
  User,
  DollarSign,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { cadastrarUsuario, fazerLogin } from '../../services/authService';
import { Usuario } from '../../types/finance';

interface AuthViewProps {
  onLoginSucesso: (usuario: Usuario) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSucesso }) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');

  // Campos de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Campos de cadastro
  const [cadNome, setCadNome] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadConfirmaSenha, setCadConfirmaSenha] = useState('');
  const [cadRenda, setCadRenda] = useState<number>(5000);
  const [cadTeto, setCadTeto] = useState<number>(35);

  // Estados da interface
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  // ----------------- LOGIN -----------------

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (carregando) return;

    setErro(null);
    setSucessoMsg(null);
    setCarregando(true);

    try {
      const res = await fazerLogin(loginEmail, loginSenha);

      if (res.sucesso && res.usuario) {
        onLoginSucesso(res.usuario);
      } else {
        setErro(res.erro || 'Falha ao efetuar login.');
      }
    } catch (error) {
      console.error('Erro no formulário de login:', error);
      setErro('Não foi possível entrar. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // ----------------- CADASTRO -----------------

  const handleCadastroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (carregando) return;

    setErro(null);
    setSucessoMsg(null);

    if (cadSenha !== cadConfirmaSenha) {
      setErro('A confirmação de senha não coincide com a senha digitada.');
      return;
    }

    if (cadSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (cadRenda < 0) {
      setErro('Informe uma renda mensal válida.');
      return;
    }

    setCarregando(true);

    try {
      const res = await cadastrarUsuario({
        nome: cadNome,
        email: cadEmail,
        senha: cadSenha,
        rendaMensal: cadRenda,
        tetoComprometimentoPercentual: cadTeto,
      });

      if (res.sucesso && res.usuario) {
        setSucessoMsg(
          'Conta criada com sucesso! Carregando seu espaço financeiro...'
        );

        onLoginSucesso(res.usuario);
      } else {
        setErro(res.erro || 'Falha ao cadastrar conta.');
      }
    } catch (error) {
      console.error('Erro no formulário de cadastro:', error);
      setErro('Não foi possível criar sua conta. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // ----------------- TROCA DE MODO -----------------

  const trocarModo = (novoModo: 'login' | 'cadastro') => {
    if (carregando) return;

    setModo(novoModo);
    setErro(null);
    setSucessoMsg(null);
    setMostrarSenha(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-100">

      {/* Cartão principal */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50">

        {/* Identidade visual */}
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-3">
            <CreditCard className="h-7 w-7 text-white" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            Parcela<span className="text-emerald-400">Fácil</span>
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Controle de compras parceladas com projeção temporal e faturas futuras
          </p>
        </div>

        {/* Alternância entre login e cadastro */}
        <div className="p-1 bg-slate-800/80 rounded-2xl flex gap-1 mb-6 border border-slate-700/60">
          <button
            type="button"
            disabled={carregando}
            onClick={() => trocarModo('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${modo === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Acessar Conta
          </button>

          <button
            type="button"
            disabled={carregando}
            onClick={() => trocarModo('cadastro')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${modo === 'cadastro'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Criar Minha Conta
          </button>
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{erro}</div>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {sucessoMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>{sucessoMsg}</div>
          </div>
        )}

        {/* ================= LOGIN ================= */}

        {modo === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Endereço de E-mail
              </label>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

                <input
                  type="email"
                  required
                  disabled={carregando}
                  placeholder="seu.email@exemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sua Senha
              </label>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  disabled={carregando}
                  placeholder="••••••••"
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium"
                />

                <button
                  type="button"
                  disabled={carregando}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {mostrarSenha
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {carregando ? (
                <span>Validando credenciais...</span>
              ) : (
                <>
                  <span>Entrar no ParcelaFácil</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= CADASTRO ================= */}

        {modo === 'cadastro' && (
          <form onSubmit={handleCadastroSubmit} className="space-y-3.5">

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Completo *
              </label>

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

                <input
                  type="text"
                  required
                  disabled={carregando}
                  placeholder="Seu nome"
                  value={cadNome}
                  onChange={(e) => setCadNome(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail para Acesso *
              </label>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />

                <input
                  type="email"
                  required
                  disabled={carregando}
                  placeholder="seu.email@exemplo.com"
                  value={cadEmail}
                  onChange={(e) => setCadEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha (mín. 6) *
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />

                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    disabled={carregando}
                    minLength={6}
                    placeholder="••••••••"
                    value={cadSenha}
                    onChange={(e) => setCadSenha(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmar Senha *
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />

                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    disabled={carregando}
                    minLength={6}
                    placeholder="••••••••"
                    value={cadConfirmaSenha}
                    onChange={(e) => setCadConfirmaSenha(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sua Renda Mensal (R$)
                </label>

                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />

                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    disabled={carregando}
                    value={cadRenda}
                    onChange={(e) => setCadRenda(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teto de Alerta ({cadTeto}%)
                </label>

                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  disabled={carregando}
                  value={cadTeto}
                  onChange={(e) => setCadTeto(Number(e.target.value))}
                  className="w-full accent-indigo-500 mt-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />

              <span>
                Seus cartões e faturas serão privados apenas para sua conta.
              </span>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {carregando ? (
                <span>Criando seu perfil...</span>
              ) : (
                <>
                  <span>Criar Conta & Iniciar</span>
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-6 text-center text-xs text-slate-500">
        ParcelaFácil © 2026 • Controle financeiro inteligente
      </div>
    </div>
  );
};
