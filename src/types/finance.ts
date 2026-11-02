/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  rendaMensal: number;
  tetoComprometimentoPercentual: number; // ex: 30% da renda ou limite total
  criadoEm: string;
  avatarCor?: string;
}

export interface UsuarioComCredenciais extends Usuario {
  senhaHash: string;
}

export interface SessaoAuth {
  token: string;
  usuario: Usuario;
  expiraEm: string;
}

export type BandeiraCartao = 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard' | 'outro';

export interface Cartao {
  id: string;
  nome: string; // Ex: "Nubank Roxinho", "Itaú Personnalité"
  ultimosDigitos: string; // Ex: "4821"
  bandeira: BandeiraCartao;
  limiteTotal: number; // R$
  diaFechamento: number; // 1 a 31
  diaVencimento: number; // 1 a 31
  corHex: string; // Cor visual do cartão
  banco: string;
}

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icone: string;
}

export interface Parcela {
  id: string;
  compraId: string;
  cartaoId: string;
  numeroParcela: number; // 1, 2, ...
  totalParcelas: number; // ex: 10
  valor: number; // R$
  mesVencimento: string; // Formato "YYYY-MM" (ex: "2026-11")
  dataVencimentoReal: string; // "YYYY-MM-DD"
  paga: boolean;
}

export interface Compra {
  id: string;
  cartaoId: string;
  categoriaId: string;
  descricao: string;
  estabelecimento: string;
  valorTotal: number;
  quantidadeParcelas: number;
  dataCompra: string; // "YYYY-MM-DD"
  primeiraFaturaMes: string; // "YYYY-MM"
  observacoes?: string;
  criadoEm: string;
}

export interface ProjecaoMes {
  mesAno: string; // "YYYY-MM"
  mesFormatado: string; // "Nov 2026"
  totalFatura: number;
  totalPorCartao: Record<string, number>;
  totalPorCategoria: Record<string, number>;
  parcelas: (Parcela & { compraDescricao: string; cartaoNome: string; categoriaNome: string })[];
}

export interface RecomendacaoCartao {
  cartao: Cartao;
  diasAteVencimento: number;
  dataVencimentoPrevista: string;
  faturaAlvo: string;
  melhorOpcaoHoje: boolean;
  motivo: string;
}

export interface SimulacaoNovaCompra {
  descricao: string;
  cartaoId: string;
  categoriaId: string;
  valorTotal: number;
  quantidadeParcelas: number;
}

export interface SimulacaoAntecipacao {
  compraId: string;
  parcelasRestantes: number;
  valorTotalRestante: number;
  taxaDescontoAnual: number; // ex: 10%
  valorComDesconto: number;
  economiaTotal: number;
}
