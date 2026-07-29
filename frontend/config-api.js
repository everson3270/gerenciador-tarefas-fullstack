// Configuração da API
export const API_URL = 'http://localhost:3000/api';

// Função para fazer requisições autenticadas
export async function fazerRequisicao(endpoint, opcoes = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...opcoes.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const resposta = await fetch(`${API_URL}${endpoint}`, {
            ...opcoes,
            headers
        });

        if (resposta.status === 401) {
            // Token expirado ou inválido
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
            return null;
        }

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || 'Erro na requisição');
        }

        return dados;
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        throw erro;
    }
}