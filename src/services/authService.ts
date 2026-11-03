/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartao, Compra, SessaoAuth, Usuario, UsuarioComCredenciais } from '../types/finance';
import { INITIAL_CARDS, INITIAL_PURCHASES, INITIAL_USER } from '../data/mockData';

const KEY_USUARIOS_DB = 'pf_usuarios_db_v1';
const KEY_SESSAO_ATIVA = 'pf_sessao_ativa_v1';

// Função utilitária para hash simples e reversível de demonstração/local
function simpleHash(senha: string): string {
  let hash = 0;
  for (let i = 0; i < senha.length; i++) {
    const char = senha.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}_${senha.length * 7}`;
}

// Inicializar banco de usuários com a conta padrão caso esteja vazio
function carregarUsuariosDb(): UsuarioComCredenciais[] {
  const data = localStorage.getItem(KEY_USUARIOS_DB);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }

  // Contas semente padrão
  const usuariosPadrao: UsuarioComCredenciais[] = [
    {
      ...INITIAL_USER,
      avatarCor: '#6366F1',
      senhaHash: simpleHash('123456'), // Senha padrão de teste
    },
    {
      id: 'usr-mariana',
      nome: 'Mariana Silva',
      email: 'mariana@exemplo.com.br',
      rendaMensal: 6200.0,
      tetoComprometimentoPercentual: 30.0,
      criadoEm: '2026-02-01',
      avatarCor: '#EC4899',
      senhaHash: simpleHash('123456'),
    },
  ];

  localStorage.setItem(KEY_USUARIOS_DB, JSON.stringify(usuariosPadrao));

  // Inicializa dados isolados do usuário inicial se não existirem
  const keyCartoesDiego = `pf_cartoes_${INITIAL_USER.id}`;
  const keyComprasDiego = `pf_compras_${INITIAL_USER.id}`;
  if (!localStorage.getItem(keyCartoesDiego)) {
    localStorage.setItem(keyCartoesDiego, JSON.stringify(INITIAL_CARDS));
  }
  if (!localStorage.getItem(keyComprasDiego)) {
    localStorage.setItem(keyComprasDiego, JSON.stringify(INITIAL_PURCHASES));
  }

  // Inicializa dados isolados para Mariana (outra conta com dados diferentes para testar isolamento)
  const keyCartoesMariana = `pf_cartoes_usr-mariana`;
  const keyComprasMariana = `pf_compras_usr-mariana`;
  if (!localStorage.getItem(keyCartoesMariana)) {
    const cartoesMariana: Cartao[] = [
      {
        id: 'card-inter-mariana',
        nome: 'Inter Mastercard Gold',
        banco: 'Banco Inter',
        ultimosDigitos: '1244',
        bandeira: 'mastercard',
        limiteTotal: 7500.0,
        diaFechamento: 15,
        diaVencimento: 22,
        corHex: '#EA580C',
      },
      {
        id: 'card-c6-mariana',
        nome: 'C6 Bank Carbon',
        banco: 'C6 Bank',
        ultimosDigitos: '7890',
        bandeira: 'mastercard',
        limiteTotal: 12000.0,
        diaFechamento: 28,
        diaVencimento: 5,
        corHex: '#1E293B',
      },
    ];
    localStorage.setItem(keyCartoesMariana, JSON.stringify(cartoesMariana));
  }
  if (!localStorage.getItem(keyComprasMariana)) {
    const comprasMariana: Compra[] = [
      {
        id: 'compra-mar-1',
        cartaoId: 'card-inter-mariana',
        categoriaId: 'cat-casa',
        descricao: 'Geladeira Frost Free Inox',
        estabelecimento: 'Casas Bahia',
        valorTotal: 3899.0,
        quantidadeParcelas: 10,
        dataCompra: '2026-10-10',
        primeiraFaturaMes: '2026-10',
        observacoes: 'Parcelamento sem juros',
        criadoEm: '2026-10-10T12:00:00Z',
      },
      {
        id: 'compra-mar-2',
        cartaoId: 'card-c6-mariana',
        categoriaId: 'cat-vestuario',
        descricao: 'Vestido & Casaco de Lã',
        estabelecimento: 'Zara Shopping',
        valorTotal: 890.0,
        quantidadeParcelas: 3,
        dataCompra: '2026-10-29',
        primeiraFaturaMes: '2026-11',
        criadoEm: '2026-10-29T18:00:00Z',
      },
    ];
    localStorage.setItem(keyComprasMariana, JSON.stringify(comprasMariana));
  }

  return usuariosPadrao;
}

function salvarUsuariosDb(usuarios: UsuarioComCredenciais[]): void {
  localStorage.setItem(KEY_USUARIOS_DB, JSON.stringify(usuarios));
}

// ----------------- API / FUNÇÕES DE AUTENTICAÇÃO -----------------

export interface CadastroPayload {
  nome: string;
  email: string;
  senha: string;
  rendaMensal: number;
  tetoComprometimentoPercentual?: number;
}

export function cadastrarUsuario(payload: CadastroPayload): { sucesso: boolean; usuario?: Usuario; erro?: string } {
  const usuarios = carregarUsuariosDb();
  const emailNormalizado = payload.email.trim().toLowerCase();

  if (!payload.nome.trim()) {
    return { sucesso: false, erro: 'O nome completo é obrigatório.' };
  }
  if (!emailNormalizado || !emailNormalizado.includes('@')) {
    return { sucesso: false, erro: 'Informe um endereço de e-mail válido.' };
  }
  if (!payload.senha || payload.senha.length < 6) {
    return { sucesso: false, erro: 'A senha deve ter no mínimo 6 caracteres.' };
  }

  const jaExiste = usuarios.some((u) => u.email.toLowerCase() === emailNormalizado);
  if (jaExiste) {
    return { sucesso: false, erro: 'Este e-mail já está cadastrado. Tente entrar na sua conta.' };
  }

  const coresAvatar = ['#6366F1', '#EC4899', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
  const corAleatoria = coresAvatar[Math.floor(Math.random() * coresAvatar.length)];

  const novoUsuario: UsuarioComCredenciais = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nome: payload.nome.trim(),
    email: emailNormalizado,
    rendaMensal: Number(payload.rendaMensal) || 0,
    tetoComprometimentoPercentual: Number(payload.tetoComprometimentoPercentual) || 35.0,
    criadoEm: new Date().toISOString(),
    avatarCor: corAleatoria,
    senhaHash: simpleHash(payload.senha),
  };

  usuarios.push(novoUsuario);
  salvarUsuariosDb(usuarios);

  // Inicializa espaço de dados vazio e limpo para o novo usuário
  const cartaoInicial: Cartao = {
    id: `card_inicial_${novoUsuario.id}`,
    nome: 'Meu Cartão Principal',
    banco: 'Banco Principal',
    ultimosDigitos: '1234',
    bandeira: 'mastercard',
    limiteTotal: 5000.0,
    diaFechamento: 20,
    diaVencimento: 27,
    corHex: '#820AD1',
  };

  localStorage.setItem(`pf_cartoes_${novoUsuario.id}`, JSON.stringify([cartaoInicial]));
  localStorage.setItem(`pf_compras_${novoUsuario.id}`, JSON.stringify([]));

  // Efetua login automático
  const sessao: SessaoAuth = {
    token: `token_${novoUsuario.id}_${Date.now()}`,
    usuario: {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      rendaMensal: novoUsuario.rendaMensal,
      tetoComprometimentoPercentual: novoUsuario.tetoComprometimentoPercentual,
      criadoEm: novoUsuario.criadoEm,
      avatarCor: novoUsuario.avatarCor,
    },
    expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  localStorage.setItem(KEY_SESSAO_ATIVA, JSON.stringify(sessao));

  return { sucesso: true, usuario: sessao.usuario };
}

export function fazerLogin(email: string, senha: string): { sucesso: boolean; usuario?: Usuario; erro?: string } {
  const usuarios = carregarUsuariosDb();
  const emailNormalizado = email.trim().toLowerCase();

  const usuarioEncontrado = usuarios.find((u) => u.email.toLowerCase() === emailNormalizado);
  if (!usuarioEncontrado) {
    return { sucesso: false, erro: 'E-mail ou senha incorretos. Verifique suas credenciais.' };
  }

  const hashDigitado = simpleHash(senha);
  if (usuarioEncontrado.senhaHash !== hashDigitado) {
    return { sucesso: false, erro: 'E-mail ou senha incorretos. Verifique suas credenciais.' };
  }

  const usuarioSemHash: Usuario = {
    id: usuarioEncontrado.id,
    nome: usuarioEncontrado.nome,
    email: usuarioEncontrado.email,
    rendaMensal: usuarioEncontrado.rendaMensal,
    tetoComprometimentoPercentual: usuarioEncontrado.tetoComprometimentoPercentual,
    criadoEm: usuarioEncontrado.criadoEm,
    avatarCor: usuarioEncontrado.avatarCor || '#6366F1',
  };

  const sessao: SessaoAuth = {
    token: `token_${usuarioEncontrado.id}_${Date.now()}`,
    usuario: usuarioSemHash,
    expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  localStorage.setItem(KEY_SESSAO_ATIVA, JSON.stringify(sessao));

  return { sucesso: true, usuario: usuarioSemHash };
}

export function obterSessaoAtiva(): Usuario | null {
  const data = localStorage.getItem(KEY_SESSAO_ATIVA);
  if (!data) return null;
  try {
    const sessao: SessaoAuth = JSON.parse(data);
    // Verifica validade da data de expiração
    if (new Date(sessao.expiraEm).getTime() < Date.now()) {
      localStorage.removeItem(KEY_SESSAO_ATIVA);
      return null;
    }
    return sessao.usuario;
  } catch {
    return null;
  }
}

export function fazerLogout(): void {
  localStorage.removeItem(KEY_SESSAO_ATIVA);
}

// ----------------- GESTÃO ISOLADA DE DADOS POR USUÁRIO -----------------

export function carregarCartoesDoUsuario(userId: string): Cartao[] {
  const key = `pf_cartoes_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  // Se for o usuário padrão e ainda não existia
  if (userId === INITIAL_USER.id) {
    localStorage.setItem(key, JSON.stringify(INITIAL_CARDS));
    return INITIAL_CARDS;
  }
  return [];
}

export function salvarCartoesDoUsuario(userId: string, cartoes: Cartao[]): void {
  localStorage.setItem(`pf_cartoes_${userId}`, JSON.stringify(cartoes));
}

export function carregarComprasDoUsuario(userId: string): Compra[] {
  const key = `pf_compras_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  if (userId === INITIAL_USER.id) {
    localStorage.setItem(key, JSON.stringify(INITIAL_PURCHASES));
    return INITIAL_PURCHASES;
  }
  return [];
}

export function salvarComprasDoUsuario(userId: string, compras: Compra[]): void {
  localStorage.setItem(`pf_compras_${userId}`, JSON.stringify(compras));
}

export function atualizarPerfilUsuario(usuarioAtualizado: Usuario): void {
  const usuarios = carregarUsuariosDb();
  const idx = usuarios.findIndex((u) => u.id === usuarioAtualizado.id);
  if (idx !== -1) {
    usuarios[idx] = {
      ...usuarios[idx],
      nome: usuarioAtualizado.nome,
      rendaMensal: usuarioAtualizado.rendaMensal,
      tetoComprometimentoPercentual: usuarioAtualizado.tetoComprometimentoPercentual,
    };
    salvarUsuariosDb(usuarios);
  }

  const sessaoAtual = obterSessaoAtiva();
  if (sessaoAtual && sessaoAtual.id === usuarioAtualizado.id) {
    localStorage.setItem(
      KEY_SESSAO_ATIVA,
      JSON.stringify({
        token: `token_${usuarioAtualizado.id}`,
        usuario: usuarioAtualizado,
        expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
    );
  }
}
