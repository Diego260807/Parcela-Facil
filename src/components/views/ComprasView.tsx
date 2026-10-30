/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Sparkles,
  Search,
  Filter,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Trash2,
  Tag,
} from 'lucide-react';
import { Cartao, Categoria, Compra } from '../../types/finance';
import { formatarMoeda, gerarParcelas } from '../../services/installmentEngine';

interface ComprasViewProps {
  compras: Compra[];
  cartoes: Cartao[];
  categorias: Categoria[];
  onOpenNovaCompra: (initialMode?: 'manual' | 'ocr') => void;
  onDeleteCompra: (compraId: string) => void;
}

export const ComprasView: React.FC<ComprasViewProps> = ({
  compras,
  cartoes,
  categorias,
  onOpenNovaCompra,
  onDeleteCompra,
}) => {
  const [busca, setBusca] = useState('');
  const [cartaoFiltro, setCartaoFiltro] = useState<string>('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [compraExpandidaId, setCompraExpandidaId] = useState<string | null>(null);

  const cartaoMap = new Map(cartoes.map((c) => [c.id, c]));
  const categoriaMap = new Map(categorias.map((cat) => [cat.id, cat]));

  // Filtragem
  const comprasFiltradas = compras.filter((c) => {
    const matchBusca =
      c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      (c.estabelecimento && c.estabelecimento.toLowerCase().includes(busca.toLowerCase()));
    const matchCartao = cartaoFiltro === 'todos' || c.cartaoId === cartaoFiltro;
    const matchCategoria = categoriaFiltro === 'todas' || c.categoriaId === categoriaFiltro;
    return matchBusca && matchCartao && matchCategoria;
  });

  const toggleExpand = (id: string) => {
    setCompraExpandidaId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Entry Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Histórico de Compras Parceladas</h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Acompanhe o andamento das parcelas e adicione novas compras via formulário ou foto do cupom
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Smart OCR AI button */}
          <button
            onClick={() => onOpenNovaCompra('ocr')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-900/20 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Leitura IA (OCR)</span>
          </button>

          {/* Standard Manual button */}
          <button
            onClick={() => onOpenNovaCompra('manual')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Entrada Manual</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome da compra ou estabelecimento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={cartaoFiltro}
            onChange={(e) => setCartaoFiltro(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="todos">Todos os Cartões</option>
            {cartoes.map((cartao) => (
              <option key={cartao.id} value={cartao.id}>
                {cartao.nome}
              </option>
            ))}
          </select>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="todas">Todas as Categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of Purchases */}
      {comprasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-800">Nenhuma compra encontrada</h4>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cadastre uma compra manualmente ou faça o upload de um comprovante.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comprasFiltradas.map((compra) => {
            const cartao = cartaoMap.get(compra.cartaoId);
            const categoria = categoriaMap.get(compra.categoriaId);
            const isExpanded = compraExpandidaId === compra.id;
            const parcelas = cartao ? gerarParcelas(compra, cartao) : [];
            const valorParcelaMedia = (compra.valorTotal / compra.quantidadeParcelas).toFixed(2);

            return (
              <div
                key={compra.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Header Summary Row */}
                <div
                  onClick={() => toggleExpand(compra.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
                      style={{ backgroundColor: categoria?.cor || '#6366F1' }}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {compra.descricao}
                        </h4>
                        {categoria && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${categoria.cor}15`,
                              color: categoria.cor,
                            }}
                          >
                            {categoria.nome}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {compra.estabelecimento && (
                          <span>Loja: {compra.estabelecimento}</span>
                        )}
                        <span>• Data: {compra.dataCompra}</span>
                        {cartao && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                            {cartao.nome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Values & Expansion trigger */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        {formatarMoeda(compra.valorTotal)}
                      </div>
                      <div className="text-xs text-indigo-600 font-semibold">
                        {compra.quantidadeParcelas}x de {formatarMoeda(Number(valorParcelaMedia))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCompra(compra.id);
                        }}
                        title="Excluir Compra"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion: Installments schedule */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-5 pt-2 bg-slate-50/70 border-t border-slate-100">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Cronograma de Cobrança das Parcelas
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                      {parcelas.map((parc) => (
                        <div
                          key={parc.id}
                          className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                            <span>
                              Parc. {parc.numeroParcela}/{parc.totalParcelas}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-bold">
                              {parc.mesVencimento}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {formatarMoeda(parc.valor)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Vence: {parc.dataVencimentoReal}
                          </div>
                        </div>
                      ))}
                    </div>

                    {compra.observacoes && (
                      <p className="text-xs text-slate-500 italic mt-3">
                        Observações: "{compra.observacoes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
