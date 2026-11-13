
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cartao, Compra, Usuario } from '../types/finance';
import { supabase } from '../lib/supabase';

// ----------------- TIPOS -----------------

export interface CadastroPayload {
  nome: string;
  email: string;
  senha: string;
  rendaMensal: number;
  tetoComprometimentoPercentual?: number;
}

export interface ResultadoAuth {
  sucesso: boolean;
  usuario?: Usuario;
  erro?: string;
}

// ----------------- CONVERSÕES -----------------

function converterPerfil(perfil: any): Usuario {
  return {
    id: perfil.id,
    nome: perfil.nome,
    email: perfil.email,
    rendaMensal: Number(perfil.renda_mensal ?? 0),
    tetoComprometimentoPercentual: Number(
      perfil.teto_comprometimento_percentual ?? 35
    ),
    criadoEm: perfil.criado_em ?? new Date().toISOString(),
    avatarCor: '#6366F1',
  };
}

function converterCartao(row: any): Cartao {
  return {
    id: row.id,
    nome: row.nome,
    banco: row.banco ?? '',
    ultimosDigitos: row.ultimos_digitos ?? '',
    bandeira: row.bandeira ?? 'outro',
    limiteTotal: Number(row.limite_total),
    diaFechamento: Number(row.dia_fechamento ?? 1),
    diaVencimento: Number(row.dia_vencimento ?? 1),
    corHex: row.cor_hex ?? '#6366F1',
  };
}

function converterCompra(row: any): Compra {
  return {
    id: row.id,
    cartaoId: row.cartao_id ?? '',
    categoriaId: row.categoria_id ?? '',
    descricao: row.descricao,
    estabelecimento: row.estabelecimento ?? '',
    valorTotal: Number(row.valor_total),
    quantidadeParcelas: Number(row.quantidade_parcelas),
    dataCompra: row.data_compra ?? '',
    primeiraFaturaMes: row.primeira_fatura_mes
      ? String(row.primeira_fatura_mes).slice(0, 7)
      : '',
    observacoes: row.observacoes ?? '',
    criadoEm: row.criado_em ?? new Date().toISOString(),
  };
}

function converterMesParaData(mes: string): string | null {
  if (!mes) return null;

  return /^\d{4}-\d{2}$/.test(mes)
    ? `${mes}-01`
    : mes;
}

// ----------------- PERFIL -----------------

async function buscarOuCriarPerfil(
  userId: string,
  dadosIniciais?: Partial<CadastroPayload>,
  emailAuth?: string
): Promise<Usuario> {
  const { data: perfilExistente, error: erroBusca } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (erroBusca) {
    throw erroBusca;
  }

  if (perfilExistente) {
    return converterPerfil(perfilExistente);
  }

  const { data: authData } = await supabase.auth.getUser();
  const usuarioAuth = authData.user;

  const perfil = {
    id: userId,
    nome: dadosIniciais?.nome?.trim()
      || usuarioAuth?.user_metadata?.nome
      || 'Usuário',
    email: emailAuth || usuarioAuth?.email || '',
    renda_mensal: Number(dadosIniciais?.rendaMensal ?? 0),
    teto_comprometimento_percentual: Number(
      dadosIniciais?.tetoComprometimentoPercentual ?? 35
    ),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(perfil, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return converterPerfil(data);
}

// ----------------- AUTENTICAÇÃO -----------------

export async function cadastrarUsuario(
  payload: CadastroPayload
): Promise<ResultadoAuth> {
  const nome = payload.nome.trim();
  const email = payload.email.trim().toLowerCase();

  if (!nome) {
    return { sucesso: false, erro: 'O nome completo é obrigatório.' };
  }

  if (!email || !email.includes('@')) {
    return { sucesso: false, erro: 'Informe um endereço de e-mail válido.' };
  }

  if (!payload.senha || payload.senha.length < 6) {
    return {
      sucesso: false,
      erro: 'A senha deve ter no mínimo 6 caracteres.',
    };
  }

  if (Number(payload.rendaMensal) < 0) {
    return { sucesso: false, erro: 'Informe uma renda válida.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: payload.senha,
      options: {
        data: {
          nome,
          renda_mensal: Number(payload.rendaMensal) || 0,
          teto_comprometimento_percentual:
            Number(payload.tetoComprometimentoPercentual) || 35,
        },
      },
    });

    if (error) {
      return {
        sucesso: false,
        erro: error.message,
      };
    }

    if (!data.user) {
      return {
        sucesso: false,
        erro: 'Não foi possível criar sua conta.',
      };
    }

    if (!data.session) {
      return {
        sucesso: false,
        erro: 'Conta criada, mas não foi possível iniciar a sessão. Verifique a configuração de confirmação de e-mail no Supabase.',
      };
    }

    const usuario = await buscarOuCriarPerfil(
      data.user.id,
      payload,
      email
    );

    return { sucesso: true, usuario };
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);

    return {
      sucesso: false,
      erro: 'Não foi possível concluir o cadastro. Tente novamente.',
    };
  }
}

export async function fazerLogin(
  email: string,
  senha: string
): Promise<ResultadoAuth> {
  const emailNormalizado = email.trim().toLowerCase();

  if (!emailNormalizado || !senha) {
    return {
      sucesso: false,
      erro: 'Informe seu e-mail e sua senha.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password: senha,
    });

    if (error) {
      return {
        sucesso: false,
        erro: 'E-mail ou senha incorretos. Verifique suas credenciais.',
      };
    }

    if (!data.user) {
      return {
        sucesso: false,
        erro: 'Não foi possível identificar sua conta.',
      };
    }

    const usuario = await buscarOuCriarPerfil(
      data.user.id,
      undefined,
      data.user.email
    );

    return { sucesso: true, usuario };
  } catch (error) {
    console.error('Erro ao fazer login:', error);

    return {
      sucesso: false,
      erro: 'Não foi possível entrar. Tente novamente.',
    };
  }
}

export async function obterSessaoAtiva(): Promise<Usuario | null> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.user) {
      return null;
    }

    return await buscarOuCriarPerfil(
      data.session.user.id,
      undefined,
      data.session.user.email
    );
  } catch (error) {
    console.error('Erro ao recuperar sessão:', error);
    return null;
  }
}

export async function fazerLogout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

// ----------------- CARTÕES -----------------

export async function carregarCartoesDoUsuario(
  userId: string
): Promise<Cartao[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('criado_em', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(converterCartao);
}

export async function salvarCartoesDoUsuario(
  userId: string,
  cartoes: Cartao[]
): Promise<void> {
  if (!cartoes.length) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return;
  }

  const registros = cartoes.map((cartao) => ({
    id: cartao.id,
    user_id: userId,
    nome: cartao.nome,
    banco: cartao.banco,
    ultimos_digitos: cartao.ultimosDigitos,
    bandeira: cartao.bandeira,
    limite_total: cartao.limiteTotal,
    dia_fechamento: cartao.diaFechamento,
    dia_vencimento: cartao.diaVencimento,
    cor_hex: cartao.corHex,
  }));

  const { error } = await supabase
    .from('cards')
    .upsert(registros, { onConflict: 'id' });

  if (error) throw error;

  // Remove somente cartões deste usuário que não estão mais na lista.
  const idsAtuais = cartoes.map((cartao) => cartao.id);

  const { data: existentes, error: erroBusca } = await supabase
    .from('cards')
    .select('id')
    .eq('user_id', userId);

  if (erroBusca) throw erroBusca;

  const idsRemover = (existentes ?? [])
    .map((item) => item.id)
    .filter((id) => !idsAtuais.includes(id));

  for (const id of idsRemover) {
    const { error: erroDelete } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (erroDelete) throw erroDelete;
  }
}

// ----------------- COMPRAS -----------------

export async function carregarComprasDoUsuario(
  userId: string
): Promise<Compra[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(converterCompra);
}

export async function salvarComprasDoUsuario(
  userId: string,
  compras: Compra[]
): Promise<void> {
  if (!compras.length) {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return;
  }

  const registros = compras.map((compra) => ({
    id: compra.id,
    user_id: userId,
    cartao_id: compra.cartaoId || null,
    categoria_id: compra.categoriaId || null,
    descricao: compra.descricao,
    estabelecimento: compra.estabelecimento || null,
    valor_total: compra.valorTotal,
    quantidade_parcelas: compra.quantidadeParcelas,
    data_compra: compra.dataCompra || null,
    primeira_fatura_mes: converterMesParaData(
      compra.primeiraFaturaMes
    ),
    observacoes: compra.observacoes || null,
    criado_em: compra.criadoEm,
  }));

  const { error } = await supabase
    .from('purchases')
    .upsert(registros, { onConflict: 'id' });

  if (error) throw error;

  // Remove somente compras deste usuário que não estão mais na lista.
  const idsAtuais = compras.map((compra) => compra.id);

  const { data: existentes, error: erroBusca } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId);

  if (erroBusca) throw erroBusca;

  const idsRemover = (existentes ?? [])
    .map((item) => item.id)
    .filter((id) => !idsAtuais.includes(id));

  for (const id of idsRemover) {
    const { error: erroDelete } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (erroDelete) throw erroDelete;
  }
}

// ----------------- ATUALIZAÇÃO DO PERFIL -----------------

export async function atualizarPerfilUsuario(
  usuarioAtualizado: Usuario
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      renda_mensal: usuarioAtualizado.rendaMensal,
      teto_comprometimento_percentual:
        usuarioAtualizado.tetoComprometimentoPercentual,
    })
    .eq('id', usuarioAtualizado.id);

  if (error) {
    throw error;
  }
}
