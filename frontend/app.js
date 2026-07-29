import { fazerRequisicao, API_URL } from './config-api.js';

// ============================================================
// AUTENTICAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const cadastroForm = document.getElementById('cadastroForm');

    if (loginForm) {
        loginForm.addEventListener('submit', realizarLogin);
    }

    if (cadastroForm) {
        cadastroForm.addEventListener('submit', realizarCadastro);
    }

    carregarNomeUsuario();
});

function mostrarLogin() {
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('cadastroCard').classList.add('hidden');
}

function mostrarCadastro() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('cadastroCard').classList.remove('hidden');
}

async function realizarLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    if (!email || !senha) {
        mostrarMensagem('mensagemLogin', 'Preencha todos os campos', 'error');
        return;
    }

    try {
        const resposta = await fazerRequisicao('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });

        if (resposta) {
            localStorage.setItem('token', resposta.token);
            localStorage.setItem('usuario', JSON.stringify(resposta.usuario));

            mostrarMensagem('mensagemLogin', 'Login realizado com sucesso!', 'success');

            setTimeout(() => {
                const perfil = resposta.usuario.perfil || 'Usuario';
                if (perfil === 'Admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1500);
        }
    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('mensagemLogin', erro.message || 'Erro ao realizar login', 'error');
    }
}

async function realizarCadastro(event) {
    event.preventDefault();

    const nome = document.getElementById('cadastroNome').value;
    const email = document.getElementById('cadastroEmail').value;
    const senha = document.getElementById('cadastroSenha').value;
    const confirmaSenha = document.getElementById('cadastroConfirmaSenha').value;

    if (!nome || !email || !senha || !confirmaSenha) {
        mostrarMensagem('mensagemCadastro', 'Preencha todos os campos', 'error');
        return;
    }

    if (senha !== confirmaSenha) {
        mostrarMensagem('mensagemCadastro', 'As senhas não conferem', 'error');
        return;
    }

    if (senha.length < 8) {
        mostrarMensagem('mensagemCadastro', 'A senha deve ter no mínimo 8 caracteres', 'error');
        return;
    }

    try {
        const resposta = await fazerRequisicao('/auth/cadastro', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha })
        });

        if (resposta) {
            mostrarMensagem('mensagemCadastro', 'Cadastro realizado com sucesso! Faça login agora.', 'success');

            setTimeout(() => {
                mostrarLogin();
                document.getElementById('cadastroForm').reset();
            }, 1500);
        }
    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('mensagemCadastro', erro.message || 'Erro ao realizar cadastro', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

function carregarNomeUsuario() {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        const dados = JSON.parse(usuario);
        const elementos = document.querySelectorAll('#nomeUsuario');
        elementos.forEach(el => {
            el.textContent = `Olá, ${dados.nome}`;
        });
    }
}

function obterToken() {
    return localStorage.getItem('token');
}

function obterPerfilUsuario() {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
        const dados = JSON.parse(usuario);
        return dados.perfil || 'Usuario';
    }
    return 'Usuario';
}

function verificarAutenticacao() {
    const token = obterToken();
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function verificarPermissao(perfilRequerido) {
    const perfilUsuario = obterPerfilUsuario();

    const permissoes = {
        'Admin': ['Admin'],
        'Gerente': ['Admin', 'Gerente'],
        'Usuario': ['Admin', 'Gerente', 'Usuario']
    };

    if (!permissoes[perfilRequerido] || !permissoes[perfilRequerido].includes(perfilUsuario)) {
        alert('Você não tem permissão para acessar esta página');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

function mostrarMensagem(elementId, mensagem, tipo) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;

    elemento.textContent = mensagem;
    elemento.className = `alert alert-${tipo}`;
    elemento.classList.remove('hidden');

    setTimeout(() => {
        elemento.classList.add('hidden');
    }, 5000);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarDataInput(data) {
    return new Date(data).toISOString().split('T')[0];
}

// Exportar funções globais
window.mostrarLogin = mostrarLogin;
window.mostrarCadastro = mostrarCadastro;
window.logout = logout;
window.obterToken = obterToken;
window.obterPerfilUsuario = obterPerfilUsuario;
window.verificarAutenticacao = verificarAutenticacao;
window.verificarPermissao = verificarPermissao;
window.formatarData = formatarData;
window.formatarDataInput = formatarDataInput;
window.carregarNomeUsuario = carregarNomeUsuario;
window.mostrarMensagem = mostrarMensagem;