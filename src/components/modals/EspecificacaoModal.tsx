/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Code2, Database, Network, Copy, Check } from 'lucide-react';

interface EspecificacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EspecificacaoModal: React.FC<EspecificacaoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ddl' | 'api' | 'regras'>('ddl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const ddlSql = `-- DDL PostgreSQL: ParcelaFácil
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    renda_mensal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    teto_comprometimento_pct NUMERIC(5, 2) NOT NULL DEFAULT 35.00
);

CREATE TABLE cartoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_cartao VARCHAR(80) NOT NULL,
    limite_total NUMERIC(12, 2) NOT NULL CHECK (limite_total > 0),
    dia_fechamento SMALLINT NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
    dia_vencimento SMALLINT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    cor_hex VARCHAR(7) DEFAULT '#820AD1'
);

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(80) NOT NULL,
    cor_hex VARCHAR(7) DEFAULT '#10B981',
    icone VARCHAR(50) DEFAULT 'shopping-bag'
);

CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartao_id UUID NOT NULL REFERENCES cartoes(id) ON DELETE RESTRICT,
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    descricao VARCHAR(150) NOT NULL,
    estabelecimento VARCHAR(100),
    valor_total NUMERIC(12, 2) NOT NULL CHECK (valor_total > 0),
    num_parcelas INT NOT NULL CHECK (num_parcelas >= 1),
    data_compra DATE NOT NULL,
    primeira_fatura_ano_mes CHAR(7) NOT NULL
);

CREATE TABLE parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    cartao_id UUID NOT NULL REFERENCES cartoes(id) ON DELETE CASCADE,
    numero_parcela INT NOT NULL,
    total_parcelas INT NOT NULL,
    valor_parcela NUMERIC(12, 2) NOT NULL,
    mes_vencimento CHAR(7) NOT NULL, -- 'YYYY-MM'
    data_vencimento_real DATE NOT NULL,
    paga BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índices B-Tree para Projeção Temporal
CREATE INDEX idx_parcelas_mes ON parcelas(mes_vencimento);
CREATE INDEX idx_parcelas_cartao_mes ON parcelas(cartao_id, mes_vencimento);`;

  const apiContracts = `// Endpoints RESTful Principais (OpenAPI Spec Simplificada)

POST /api/v1/auth/login
-> Body: { email, senha }
<- 200 OK: { accessToken, refreshToken, usuario }

GET /api/v1/cartoes
<- 200 OK: [ { id, nomeCartao, limiteTotal, diaFechamento, diaVencimento } ]

GET /api/v1/cartoes/melhor-dia
<- 200 OK: { cartaoRecomendadoId, diasAteVencimento, faturaDestino, motivo }

POST /api/v1/compras
-> Body: { cartaoId, categoriaId, descricao, valorTotal, numParcelas, dataCompra }
<- 201 Created: { compraId, parcelasGeradas: [ ... ] }

POST /api/v1/compras/ocr
-> Multipart: arquivo (comprovante/cupom)
<- 200 OK: { dadosExtraidos: { estabelecimento, valorTotal, numParcelas, dataCompra } }

GET /api/v1/faturas?mes=11&ano=2026
<- 200 OK: { periodo: "2026-11", totalGeralFatura, totalPorCartao, parcelas: [ ... ] }

POST /api/v1/simulacoes
-> Body: { cartaoId, valorTotal, numParcelas, dataCompraSimulada }
<- 200 OK: { projecao12Meses: [ { mesAno, faturaAtual, faturaComSimulacao } ] }

GET /api/v1/exportar/excel?ano=2026 -> Download do .xlsx
GET /api/v1/exportar/pdf?mes=11&ano=2026 -> Download do .pdf formatado`;

  const handleCopy = () => {
    const textToCopy = activeTab === 'ddl' ? ddlSql : apiContracts;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-3xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Especificação Técnica & Arquitetura
              </h3>
              <p className="text-xs text-slate-400">
                Modelagem Relacional DDL e Contratos de API RESTful
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'ddl'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>PostgreSQL DDL (Tabelas & Índices)</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Contratos de API (RESTful)</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 leading-relaxed text-slate-300">
          <pre className="whitespace-pre-wrap">{activeTab === 'ddl' ? ddlSql : apiContracts}</pre>
        </div>
      </div>
    </div>
  );
};
