import { fazerRequisicao } from './config-api.js';

let usuarioEmEdicao = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    verificarPermissao('Admin');
    carregarNomeUsuario();
    carregarUsuarios();

    const formUsuario = document.getElementById('formUsuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', salvarUsuario);
    }

    const filtroStatus = document.getElementById('filtroStatus');
    const filtroPerfil = document.getElementById('filtroPerfil');

    if (filtroStatus) filtroStatus.addEventListener('change', carregarUsuarios);
    if (filtroPerfil) filtroPerfil.addEventListener('change', carregarUsuarios);
});

async function carregarUsuarios() {
    try {
        const filtroStatus = document.getElementById('filtroStatus')?.value || '';
        const filtroPerfil = document.getElementById('filtroPerfil')?.value || '';

        let endpoint = '/admin/usuarios';
        const params = new URLSearchParams();

        if (filtroStatus) params.append('status', filtroStatus);
        if (filtroPerfil) params.append('perfil', filtroPerfil);

        if (params.toString()) {
            endpoint += '?' + params.toString();
        }

        const usuarios = await fazerRequisicao(endpoint);

        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-600">Nenhum usuário encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(usuario => `
            <tr class="fade-in">
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>
                    <span class="px-3 py-1 rounded text-white text-sm ${
                        usuario.perfil === 'Admin' ? 'bg-red-500' :
                        usuario.perfil === 'Gerente' ? 'bg-blue-500' :
                        'bg-gray-500'
                    }">
                        ${usuario.perfil === 'Admin' ? '🔐 Admin' :
                          usuario.perfil === 'Gerente' ? '📁 Gerente' :
                          '👤 Usuário'}
                    </span>
                </td>
                <td>
                    <span class="px-3 py-1 rounded text-white text-sm ${
                        usuario.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'
                    }">
                        ${usuario.status === 'Ativo' ? '✅ Ativo' : '❌ Inativo'}
                    </span>
                </td>
                <td>${formatarData(usuario.data_criacao)}</td>
                <td>
                    <button
                        onclick="editarUsuario('${usuario.id}')"
                        class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded mr-2 transition"
                    >
                        ✏️
                    </button>
                    <button
                        onclick="deletarUsuario('${usuario.id}')"
                        class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition"
                    >
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (erro) {
        console.error('Erro:', erro);
    }
}

function abrirModalUsuario() {
    usuarioEmEdicao = null;
    document.getElementById('modalTituloUsuario').textContent = 'Editar Usuário';
    document.getElementById('formUsuario').reset();
    document.getElementById('modalUsuario').classList.remove('hidden');
}

function fecharModalUsuario() {
    document.getElementById('modalUsuario').classList.add('hidden');
}

async function salvarUsuario(event) {
    event.preventDefault();

    const nome = document.getElementById('usuarioNome').value;
    const email = document.getElementById('usuarioEmail').value;
    const perfil = document.getElementById('usuarioPerfil').value;
    const status = document.getElementById('usuarioStatus').value;

    if (!nome || !email || !perfil || !status) {
        mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        if (usuarioEmEdicao) {
            await fazerRequisicao(`/admin/usuarios/${usuarioEmEdicao}`, {
                method: 'PUT',
                body: JSON.stringify({ nome, perfil, status })
            });
            mostrarMensagem('Usuário atualizado com sucesso!', 'success');
        } else {
            mostrarMensagem('Para criar novo usuário, use o formulário de cadastro na página inicial', 'warning');
        }

        fecharModalUsuario();
        carregarUsuarios();
    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem(erro.message || 'Erro ao salvar usuário', 'error');
    }
}

async function editarUsuario(id) {
    try {
        const usuarios = await fazerRequisicao('/admin/usuarios');
        const usuario = usuarios.find(u => u.id == id);

        if (usuario) {
            usuarioEmEdicao = id;
            document.getElementById('modalTituloUsuario').textContent = 'Editar Usuário';
            document.getElementById('usuarioNome').value = usuario.nome;
            document.getElementById('usuarioEmail').value = usuario.email;
            document.getElementById('usuarioEmail').disabled = true;
            document.getElementById('usuarioPerfil').value = usuario.perfil;
            document.getElementById('usuarioStatus').value = usuario.status;

            document.getElementById('modalUsuario').classList.remove('hidden');
        }
    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('Erro ao carregar usuário', 'error');
    }
}

async function deletarUsuario(id) {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return;

    try {
        await fazerRequisicao(`/admin/usuarios/${id}`, {
            method: 'DELETE'
        });
        carregarUsuarios();
        mostrarMensagem('Usuário desativado com sucesso!', 'success');
    } catch (erro) {
        console.error('Erro:', erro);
        mostrarMensagem('Erro ao deletar usuário', 'error');
    }
}

// Exportar funções globais
window.abrirModalUsuario = abrirModalUsuario;
window.fecharModalUsuario = fecharModalUsuario;
window.editarUsuario = editarUsuario;
window.deletarUsuario = deletarUsuario;
window.carregarUsuarios = carregarUsuarios;