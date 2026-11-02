/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Layers, Target, Compass, ShieldAlert, PackageCheck } from 'lucide-react';

interface GccdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GccdModal: React.FC<GccdModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Metodologia GCCD Aplicada</h3>
              <p className="text-xs text-slate-400">
                Padrão de Engenharia de Software: Goal, Context, Constraints, Deliverables
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* G - Goal */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Target className="h-4 w-4 text-indigo-400" />
              <span>G — GOAL (Objetivo do Módulo)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Permitir que múltiplos usuários se cadastrem individualmente com e-mail, senha e renda
              mensal, e acessem com exclusividade seus próprios cartões, faturas e parcelas,
              garantindo privacidade e isolamento total entre contas.
            </p>
          </div>

          {/* C - Context */}
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
              <Compass className="h-4 w-4 text-blue-400" />
              <span>C — CONTEXT (Contexto da Aplicação)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              O ParcelaFácil lida com dados financeiros críticos (limites bancários, saldo devedor e
              projeção temporal de 12 meses). Em cenários de uso real ou compartilhado no mesmo
              dispositivo, cada usuário necessita de um ciclo de vida autônomo com login seguro,
              persistência de sessão e logout instantâneo.
            </p>
          </div>

          {/* C - Constraints */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>C — CONSTRAINTS (Restrições & Regras de Negócio)</span>
            </div>
            <ul className="text-slate-300 leading-relaxed text-xs list-disc list-inside space-y-1">
              <li>
                <strong>Unicidade:</strong> Proibição de e-mails duplicados no banco de usuários.
              </li>
              <li>
                <strong>Segurança:</strong> Senha mínima de 6 caracteres com hash de integridade e
                confirmação de digitação.
              </li>
              <li>
                <strong>Particionamento por ID:</strong> Todos os cartões e compras são indexados pela
                chave <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">user_id</code>.
              </li>
              <li>
                <strong>Sessão com Expiração:</strong> Token de sessão com expiração automática e
                limpeza de cache ao sair.
              </li>
            </ul>
          </div>

          {/* D - Deliverables */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <PackageCheck className="h-4 w-4 text-emerald-400" />
              <span>D — DELIVERABLES (Entregáveis Arquiteturais)</span>
            </div>
            <ul className="text-slate-300 leading-relaxed text-xs list-disc list-inside space-y-1">
              <li>
                <code className="text-emerald-400">authService.ts</code>: Motor de autenticação,
                validações, sessões e storage particionado.
              </li>
              <li>
                <code className="text-emerald-400">AuthView.tsx</code>: Interface moderna de Login,
                Cadastro e Switcher de contas de teste (1 clique).
              </li>
              <li>
                <code className="text-emerald-400">App.tsx & Sidebar.tsx</code>: Roteamento de sessão,
                menu de perfil dinâmico e ação de Logout.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
