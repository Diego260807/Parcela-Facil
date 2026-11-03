/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Calendar,
  CreditCard,
  ShoppingBag,
  Check,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { Cartao, Categoria, Compra } from '../../types/finance';
import { calcularPrimeiraFatura, formatarMoeda } from '../../services/installmentEngine';

interface NovaCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartoes: Cartao[];
  categorias: Categoria[];
  onSalvarCompra: (novaCompra: Omit<Compra, 'id' | 'criadoEm'>) => void;
  initialMode?: 'manual' | 'ocr';
}

export const NovaCompraModal: React.FC<NovaCompraModalProps> = ({
  isOpen,
  onClose,
  cartoes,
  categorias,
  onSalvarCompra,
  initialMode = 'manual',
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>(initialMode);

  // Form Fields
  const [descricao, setDescricao] = useState('');
  const [estabelecimento, setEstabelecimento] = useState('');
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || '');
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id || '');
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [numParcelas, setNumParcelas] = useState<number>(1);
  const [dataCompra, setDataCompra] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [observacoes, setObservacoes] = useState('');

  // OCR Upload state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const cartaoSelecionado = cartoes.find((c) => c.id === cartaoId) || cartoes[0];
  const calculoPrevia = cartaoSelecionado
    ? calcularPrimeiraFatura(dataCompra, cartaoSelecionado.diaFechamento, cartaoSelecionado.diaVencimento)
    : null;

  const valorParcelaPrevia = numParcelas > 0 ? (valorTotal / numParcelas).toFixed(2) : '0.00';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setOcrPreviewUrl(base64Data);

      try {
        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        const data = await response.json();
        if (data.success && data.extracted) {
          const ext = data.extracted;
          if (ext.store) setEstabelecimento(ext.store);
          if (ext.store && !descricao) setDescricao(`Compra ${ext.store}`);
          if (ext.totalAmount) setValorTotal(Number(ext.totalAmount));
          if (ext.purchaseDate) setDataCompra(ext.purchaseDate);
          if (ext.installments) setNumParcelas(Math.max(1, Number(ext.installments)));

          // Try matching category
          if (ext.category) {
            const matchedCat = categorias.find((c) =>
              c.nome.toLowerCase().includes(ext.category.toLowerCase())
            );
            if (matchedCat) setCategoriaId(matchedCat.id);
          }

          if (ext.notes) setObservacoes(ext.notes);

          // Switch to manual form so user can review & adjust
          setActiveTab('manual');
        } else {
          setOcrError('Não foi possível extrair dados automáticos da imagem.');
        }
      } catch (err: any) {
        console.error('OCR Error:', err);
        setOcrError('Erro ao comunicar com o leitor inteligente por IA.');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || valorTotal <= 0 || !calculoPrevia) return;

    onSalvarCompra({
      cartaoId,
      categoriaId,
      descricao,
      estabelecimento,
      valorTotal: Number(valorTotal),
      quantidadeParcelas: Number(numParcelas),
      dataCompra,
      primeiraFaturaMes: calculoPrevia.mesAnoFatura,
      observacoes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cadastrar Nova Compra</h3>
              <p className="text-xs text-slate-500">
                Preencha os dados ou faça a leitura do cupom fiscal via IA
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

        {/* Tab switch: Manual vs OCR */}
        <div className="p-4 bg-slate-100/70 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>1. Entrada Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ocr')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ocr'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <span>2. Leitura Inteligente por IA</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'ocr' ? (
            /* OCR UPLOAD TAB */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-emerald-50/20 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {ocrLoading ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-800">
                      A Inteligência Artificial está lendo o comprovante...
                    </p>
                    <p className="text-xs text-slate-500">
                      Identificando loja, total, data e quantidade de parcelas
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Clique ou arraste a foto do cupom / comprovante
                    </p>
                    <p className="text-xs text-slate-500">Formatos aceitos: JPG, PNG, PDF até 10MB</p>
                  </div>
                )}
              </div>

              {ocrError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{ocrError}</span>
                </div>
              )}

              {ocrPreviewUrl && (
                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <span>Imagem selecionada pronta para análise</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Ver dados extraídos no formulário &rarr;
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* MANUAL FORM TAB */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome / Descrição da Compra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tênis Corrida Nike, Smart TV 55"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Estabelecimento & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loja / Estabelecimento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Magazine Luiza, Amazon"
                    value={estabelecimento}
                    onChange={(e) => setEstabelecimento(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataCompra}
                    onChange={(e) => setDataCompra(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  />
                </div>
              </div>

              {/* Valor Total & Parcelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={valorTotal || ''}
                    onChange={(e) => setValorTotal(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade de Parcelas *
                  </label>
                  <select
                    value={numParcelas}
                    onChange={(e) => setNumParcelas(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? '1x (À vista)' : `${n}x parcelas`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cartão e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cartão de Crédito *
                  </label>
                  <select
                    value={cartaoId}
                    onChange={(e) => setCartaoId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {cartoes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} (Fecha dia {c.diaFechamento})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Engine Preview Box */}
              {calculoPrevia && valorTotal > 0 && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-indigo-900">
                    <span>Divisão das parcelas:</span>
                    <strong className="font-bold text-indigo-700">
                      {numParcelas}x de {formatarMoeda(Number(valorParcelaPrevia))}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-indigo-900">
                    <span>Primeira fatura prevista:</span>
                    <span className="font-semibold text-slate-800">
                      {calculoPrevia.mesAnoFatura} (Venc: {calculoPrevia.dataVencimentoReal})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Tempo até o 1º pagamento: <strong>{calculoPrevia.diasAteVencimento} dias</strong>.
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
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
                  Salvar Compra & Gerar Parcelas
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
