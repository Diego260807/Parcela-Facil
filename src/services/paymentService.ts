
import { supabase } from '../lib/supabase';

export interface PagamentoParcela {
    id: string;
    compraId: string;
    numeroParcela: number;
    valorPago: number;
    dataPagamento: string;
    registradoEm: string;
}

// Converte um registro do Supabase para o formato usado pelo aplicativo.
function converterPagamento(registro: any): PagamentoParcela {
    return {
        id: registro.id,
        compraId: registro.compra_id,
        numeroParcela: Number(registro.numero_parcela),
        valorPago: Number(registro.valor),
        dataPagamento: registro.data_pagamento || '',
        registradoEm: registro.criado_em || '',
    };
}

// Carrega os pagamentos de um usuário.
export async function carregarPagamentosDoUsuario(
    userId: string
): Promise<PagamentoParcela[]> {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('paga', true)
        .order('criado_em', { ascending: true });

    if (error) {
        console.error('Erro ao carregar pagamentos:', error);
        throw error;
    }

    return (data || []).map(converterPagamento);
}

// Salva a lista de pagamentos de um usuário.
// Mantida como função de sincronização para possíveis usos no aplicativo.
export async function salvarPagamentosDoUsuario(
    userId: string,
    pagamentos: PagamentoParcela[]
): Promise<void> {
    const registros = pagamentos.map((pagamento) => ({
        id: pagamento.id,
        user_id: userId,
        compra_id: pagamento.compraId,
        numero_parcela: pagamento.numeroParcela,
        valor: pagamento.valorPago,
        mes_vencimento: null,
        paga: true,
        data_pagamento: pagamento.dataPagamento || null,
    }));

    if (registros.length > 0) {
        const { error: erroSalvar } = await supabase
            .from('payments')
            .upsert(registros, { onConflict: 'id' });

        if (erroSalvar) {
            console.error('Erro ao salvar pagamentos:', erroSalvar);
            throw erroSalvar;
        }
    }

    // Remove do banco os pagamentos que não estão mais na lista.
    let consulta = supabase
        .from('payments')
        .delete()
        .eq('user_id', userId)
        .eq('paga', true);

    if (pagamentos.length > 0) {
        const ids = pagamentos.map((pagamento) => pagamento.id);
        consulta = consulta.not('id', 'in', `(${ids.join(',')})`);
    }

    const { error: erroExcluir } = await consulta;

    if (erroExcluir) {
        console.error('Erro ao sincronizar pagamentos:', erroExcluir);
        throw erroExcluir;
    }
}

// Registra uma parcela como paga.
export async function marcarParcelaComoPaga(
    userId: string,
    compraId: string,
    numeroParcela: number,
    valorPago: number,
    dataPagamento: string
): Promise<PagamentoParcela[]> {
    // Verifica se o pagamento já existe para evitar duplicidade.
    const { data: existente, error: erroConsulta } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('compra_id', compraId)
        .eq('numero_parcela', numeroParcela)
        .eq('paga', true)
        .maybeSingle();

    if (erroConsulta) {
        console.error('Erro ao verificar pagamento existente:', erroConsulta);
        throw erroConsulta;
    }

    if (existente) {
        return carregarPagamentosDoUsuario(userId);
    }

    const novoPagamento = {
        id: `pag_${compraId}_${numeroParcela}`,
        user_id: userId,
        compra_id: compraId,
        numero_parcela: numeroParcela,
        valor: valorPago,
        mes_vencimento: null,
        paga: true,
        data_pagamento: dataPagamento,
    };

    const { error: erroInsercao } = await supabase
        .from('payments')
        .insert(novoPagamento);

    if (erroInsercao) {
        console.error('Erro ao registrar pagamento:', erroInsercao);
        throw erroInsercao;
    }

    return carregarPagamentosDoUsuario(userId);
}

// Desfaz o pagamento de uma parcela.
export async function desfazerPagamentoParcela(
    userId: string,
    compraId: string,
    numeroParcela: number
): Promise<PagamentoParcela[]> {
    const { error } = await supabase
        .from('payments')
        .delete()
        .eq('user_id', userId)
        .eq('compra_id', compraId)
        .eq('numero_parcela', numeroParcela);

    if (error) {
        console.error('Erro ao desfazer pagamento:', error);
        throw error;
    }

    return carregarPagamentosDoUsuario(userId);
}

// Consulta um pagamento dentro da lista já carregada na memória.
export function buscarPagamentoParcela(
    pagamentos: PagamentoParcela[],
    compraId: string,
    numeroParcela: number
): PagamentoParcela | undefined {
    return pagamentos.find(
        (pagamento) =>
            pagamento.compraId === compraId &&
            pagamento.numeroParcela === numeroParcela
    );
}
