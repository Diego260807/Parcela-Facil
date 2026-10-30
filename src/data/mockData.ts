/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartao, Categoria, Compra, Usuario } from '../types/finance';

export const INITIAL_USER: Usuario = {
  id: 'usr-1',
  nome: 'Diego Nascimento',
  email: 'diego@parcelafacil.com.br',
  rendaMensal: 8500.00,
  tetoComprometimentoPercentual: 35.0, // Alerta se passar de 35% da renda (R$ 2.975)
  criadoEm: '2026-01-15',
};

export const INITIAL_CATEGORIES: Categoria[] = [
  { id: 'cat-alimentacao', nome: 'Alimentação & Supermercado', icone: 'shopping-cart', cor: '#10B981' },
  { id: 'cat-eletronicos', nome: 'Eletrônicos & Tecnologia', icone: 'laptop', cor: '#3B82F6' },
  { id: 'cat-casa', nome: 'Casa & Eletrodomésticos', icone: 'home', cor: '#F59E0B' },
  { id: 'cat-vestuario', nome: 'Vestuário & Moda', icone: 'shirt', cor: '#EC4899' },
  { id: 'cat-saude', nome: 'Saúde & Farmácia', icone: 'activity', cor: '#EF4444' },
  { id: 'cat-viagens', nome: 'Viagens & Lazer', icone: 'plane', cor: '#8B5CF6' },
  { id: 'cat-servicos', nome: 'Serviços & Assinaturas', icone: 'calendar', cor: '#06B6D4' },
  { id: 'cat-outros', nome: 'Outros Gastos', icone: 'tag', cor: '#64748B' },
];

export const INITIAL_CARDS: Cartao[] = [
  {
    id: 'card-nubank',
    nome: 'Nubank Ultravioleta',
    banco: 'Nubank',
    ultimosDigitos: '8821',
    bandeira: 'mastercard',
    limiteTotal: 14000.00,
    diaFechamento: 22,
    diaVencimento: 29,
    corHex: '#820AD1',
  },
  {
    id: 'card-itau',
    nome: 'Itaú Personnalité Visa',
    banco: 'Itaú',
    ultimosDigitos: '4190',
    bandeira: 'visa',
    limiteTotal: 22000.00,
    diaFechamento: 12,
    diaVencimento: 19,
    corHex: '#EA580C',
  },
  {
    id: 'card-xp',
    nome: 'XP Visa Infinite',
    banco: 'XP Investimentos',
    ultimosDigitos: '9034',
    bandeira: 'visa',
    limiteTotal: 18000.00,
    diaFechamento: 3,
    diaVencimento: 10,
    corHex: '#0F172A',
  },
];

export const INITIAL_PURCHASES: Compra[] = [
  {
    id: 'compra-1',
    cartaoId: 'card-nubank',
    categoriaId: 'cat-eletronicos',
    descricao: 'iPhone 16 Pro 256GB',
    estabelecimento: 'Apple Morumbi Shopping',
    valorTotal: 7999.00,
    quantidadeParcelas: 10,
    dataCompra: '2026-09-15',
    primeiraFaturaMes: '2026-09',
    observacoes: 'Garantia estendida inclusa',
    criadoEm: '2026-09-15T10:00:00Z',
  },
  {
    id: 'compra-2',
    cartaoId: 'card-itau',
    categoriaId: 'cat-viagens',
    descricao: 'Passagens Aéreas Férias Santiago',
    estabelecimento: 'LATAM Airlines',
    valorTotal: 3450.00,
    quantidadeParcelas: 6,
    dataCompra: '2026-08-10',
    primeiraFaturaMes: '2026-08',
    observacoes: 'Voo direto ida e volta para 2 pessoas',
    criadoEm: '2026-08-10T14:30:00Z',
  },
  {
    id: 'compra-3',
    cartaoId: 'card-xp',
    categoriaId: 'cat-casa',
    descricao: 'Smart TV Samsung 55" QLED 4K',
    estabelecimento: 'Fast Shop Online',
    valorTotal: 3199.90,
    quantidadeParcelas: 8,
    dataCompra: '2026-07-02',
    primeiraFaturaMes: '2026-07',
    observacoes: 'Frete grátis prime',
    criadoEm: '2026-07-02T19:20:00Z',
  },
  {
    id: 'compra-4',
    cartaoId: 'card-nubank',
    categoriaId: 'cat-vestuario',
    descricao: 'Jaqueta Térmica & Tênis Corrida',
    estabelecimento: 'Centauro Esportes',
    valorTotal: 849.00,
    quantidadeParcelas: 4,
    dataCompra: '2026-09-24', // pós fechamento dia 22!
    primeiraFaturaMes: '2026-10',
    observacoes: 'Aproveitado o melhor dia de compra',
    criadoEm: '2026-09-24T16:00:00Z',
  },
  {
    id: 'compra-5',
    cartaoId: 'card-itau',
    categoriaId: 'cat-saude',
    descricao: 'Check-up Exames & Oftalmo',
    estabelecimento: 'Laboratório Fleury',
    valorTotal: 1250.00,
    quantidadeParcelas: 5,
    dataCompra: '2026-10-05',
    primeiraFaturaMes: '2026-10',
    criadoEm: '2026-10-05T09:15:00Z',
  },
  {
    id: 'compra-6',
    cartaoId: 'card-xp',
    categoriaId: 'cat-eletronicos',
    descricao: 'Monitor Dell 27" 4K USB-C',
    estabelecimento: 'Dell Computadores',
    valorTotal: 2799.00,
    quantidadeParcelas: 10,
    dataCompra: '2026-10-18',
    primeiraFaturaMes: '2026-11',
    criadoEm: '2026-10-18T11:40:00Z',
  },
];
