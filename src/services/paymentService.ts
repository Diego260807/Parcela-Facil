
export interface PagamentoParcela {
    id: string;
    compraId: string;
    numeroParcela: number;
    valorPago: number;
    dataPagamento: string;
    registradoEm: string;
}

function obterChave(userId: string): string {
    return `pf_pagamentos_${userId}`;
}

export function carregarPagamentosDoUsuario(
    userId: string
): PagamentoParcela[] {
    const dados = localStorage.getItem(obterChave(userId));

    if (!dados) return [];

    try {
        const pagamentos: unknown = JSON.parse(dados);
        return Array.isArray(pagamentos) ? pagamentos : [];
    } catch {
        return [];
    }
}

export function salvarPagamentosDoUsuario(
    userId: string,
    pagamentos: PagamentoParcela[]
): void {
    localStorage.setItem(obterChave(userId), JSON.stringify(pagamentos));
}

export function marcarParcelaComoPaga(
    userId: string,
    compraId: string,
    numeroParcela: number,
    valorPago: number,
    dataPagamento: string
): PagamentoParcela[] {
    const pagamentos = carregarPagamentosDoUsuario(userId);

    const jaExiste = pagamentos.some(
        (p) =>
            p.compraId === compraId &&
            p.numeroParcela === numeroParcela
    );

    if (jaExiste) return pagamentos;

    const novoPagamento: PagamentoParcela = {
        id: `pag_${compraId}_${numeroParcela}`,
        compraId,
        numeroParcela,
        valorPago,
        dataPagamento,
        registradoEm: new Date().toISOString(),
    };

    const atualizados = [...pagamentos, novoPagamento];

    salvarPagamentosDoUsuario(userId, atualizados);

    return atualizados;
}

export function desfazerPagamentoParcela(
    userId: string,
    compraId: string,
    numeroParcela: number
): PagamentoParcela[] {
    const pagamentos = carregarPagamentosDoUsuario(userId);

    const atualizados = pagamentos.filter(
        (p) =>
            !(
                p.compraId === compraId &&
                p.numeroParcela === numeroParcela
            )
    );

    salvarPagamentosDoUsuario(userId, atualizados);

    return atualizados;
}

export function buscarPagamentoParcela(
    pagamentos: PagamentoParcela[],
    compraId: string,
    numeroParcela: number
): PagamentoParcela | undefined {
    return pagamentos.find(
        (p) =>
            p.compraId === compraId &&
            p.numeroParcela === numeroParcela
    );
}
