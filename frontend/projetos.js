import { fazerRequisicao } from './config-api.js';

let projetoEmEdicao = null;
let projetoSelecionado = null; // Usado para deletar e para membros

document.addEventListener('DOMContentLoaded', () => {
    // Acessando funções globais do app.js
    window.verificarAutenticacao();
    window.carregarNomeUsuario();
    carregarProjetos();

    const formProjeto = document.getElementById('formProjeto');
    if (formProjeto) {
        formProjeto.addEventListener('submit', salvarProjeto);
    }

    // Adiciona event listener para o botão "Novo Projeto"
    const btnNovoProjeto = document.querySelector('.btn-primary'); // Ou use um ID se tiver
    if (btnNovoProjeto) {
        btnNovoProjeto.addEventListener('click', abrirModalProjeto);
    }

    // Delegação de eventos para os botões dentro de 'listaProjetos'
    // Isso é crucial porque os projetos são carregados dinamicamente
    const listaProjetosContainer = document.getElementById('listaProjetos');
    if (listaProjetosContainer) {
        listaProjetosContainer.addEventListener('click', (event) => {
            const target = event.target;

            // Botão Editar
            if (target.classList.contains('btn-editar')) {
                const projetoId = target.dataset.projetoId;
                if (projetoId) {
                    editarProjeto(projetoId);
                }
            }
            // Botão Deletar
            else if (target.classList.contains('btn-deletar')) {
                const projetoId = target.dataset.projetoId;
                if (projetoId) {
                    deletarProjeto(projetoId);
                }
            }
            // Botão Membros
            else if (target.classList.contains('btn-membros')) {
                const projetoId = target.dataset.projetoId;
                if (projetoId) {
                    abrirModalMembros(projetoId);
                }
            }
        });
    }

    // Configura o clique do botão de confirmação dentro do modal de deleção
    document.getElementById('btnConfirmarDeletar')?.addEventListener('click', async () => {
        if (!projetoSelecionado) return;

        try {
            await fazerRequisicao(`/projetos/${projetoSelecionado}`, {
                method: 'DELETE'
            });
            fecharModalDeletar();
            carregarProjetos();
            window.mostrarMensagem('Projeto deletado com sucesso!', 'success'); // Usando mostrarMensagem do app.js
        } catch (erro) {
            console.error('Erro:', erro);
            window.mostrarMensagem(erro.message || 'Erro ao deletar projeto', 'error'); // Usando mostrarMensagem do app.js
        }
    });

    // Submissão do formulário de membros
    document.getElementById('formMembro')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuario_id = document.getElementById('selectUsuarioMembro').value;
        const papel = document.getElementById('selectPapelMembro').value;

        if (!usuario_id || !papel) {
            window.mostrarMensagem('Selecione um usuário e um papel.', 'error');
            return;
        }

        try {
            await fazerRequisicao(`/projetos/${projetoSelecionado}/membros`, {
                method: 'POST',
                body: JSON.stringify({ usuario_id, papel })
            });
            window.mostrarMensagem('Membro adicionado!', 'success');
            carregarMembrosAtuais(projetoSelecionado);
            document.getElementById('formMembro').reset(); // Limpa o formulário após adicionar
        } catch (erro) {
            console.error('Erro ao adicionar membro:', erro);
            window.mostrarMensagem(erro.message || 'Erro ao adicionar membro', 'error');
        }
    });
});

async function carregarProjetos() {
    try {
        const projetos = await fazerRequisicao('/projetos');

        const container = document.getElementById('listaProjetos');
        if (!container) return;

        if (!projetos || projetos.length === 0) {
            container.innerHTML = '<p class="text-gray-600 col-span-full">Nenhum projeto encontrado</p>';
            return;
        }

        container.innerHTML = projetos.map(projeto => `
            <div class="card fade-in">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${projeto.nome}</h3>
                <p class="text-gray-600 mb-4">${projeto.descricao || 'Sem descrição'}</p>
                <div class="text-sm text-gray-500 mb-4">
                    <p>Início: ${window.formatarData(projeto.data_inicio)}</p>
                    <p>Término: ${window.formatarData(projeto.data_fim)}</p>
                    <p>Status: <span class="font-semibold text-blue-600">${projeto.status}</span></p>
                </div>
                <div class="flex space-x-2">
                    <button
                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition btn-editar"
                        data-projeto-id="${projeto.id}"
                    >
                        ✏️ Editar
                    </button>
                    <button
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition btn-deletar"
                        data-projeto-id="${projeto.id}"
                    >
                        🗑️ Deletar
                    </button>
                    <button
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition btn-membros"
                        data-projeto-id="${projeto.id}"
                    >
                        👥 Membros
                    </button>
                </div>
            </div>
        `).join('');
    } catch (erro) {
        console.error('Erro:', erro);
        const container = document.getElementById('listaProjetos');
        if (container) {
            container.innerHTML = '<p class="text-red-600">Erro ao carregar projetos</p>';
        }
    }
}

function abrirModalProjeto() {
    projetoEmEdicao = null;
    document.getElementById('modalTitulo').textContent = 'Novo Projeto';
    document.getElementById('formProjeto').reset();
    document.getElementById('modalProjeto').classList.remove('hidden');
}

function fecharModalProjeto() {
    document.getElementById('modalProjeto').classList.add('hidden');
}

async function salvarProjeto(event) {
    event.preventDefault();

    const nome = document.getElementById('projetoNome').value;
    const descricao = document.getElementById('projetoDescricao').value;
    const data_inicio = document.getElementById('projetoDataInicio').value;
    const data_fim = document.getElementById('projetoDataFim').value;

    if (!nome || !data_inicio || !data_fim) {
        window.mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        if (projetoEmEdicao) {
            await fazerRequisicao(`/projetos/${projetoEmEdicao}`, {
                method: 'PUT',
                body: JSON.stringify({ nome, descricao, data_inicio, data_fim })
            });
            window.mostrarMensagem('Projeto atualizado com sucesso!', 'success');
        } else {
            await fazerRequisicao('/projetos', {
                method: 'POST',
                body: JSON.stringify({ nome, descricao, data_inicio, data_fim })
            });
            window.mostrarMensagem('Projeto criado com sucesso!', 'success');
        }

        fecharModalProjeto();
        carregarProjetos();
    } catch (erro) {
        console.error('Erro:', erro);
        window.mostrarMensagem(erro.message || 'Erro ao salvar projeto', 'error');
    }
}

async function editarProjeto(id) {
    try {
        const projetos = await fazerRequisicao('/projetos');
        const projeto = projetos.find(p => p.id == id);

        if (projeto) {
            projetoEmEdicao = id;
            document.getElementById('modalTitulo').textContent = 'Editar Projeto';
            document.getElementById('projetoNome').value = projeto.nome;
            document.getElementById('projetoDescricao').value = projeto.descricao || '';
            document.getElementById('projetoDataInicio').value = window.formatarDataInput(projeto.data_inicio);
            document.getElementById('projetoDataFim').value = window.formatarDataInput(projeto.data_fim);

            document.getElementById('modalProjeto').classList.remove('hidden');
        }
    } catch (erro) {
        console.error('Erro:', erro);
        window.mostrarMensagem('Erro ao carregar projeto', 'error');
    }
}

function deletarProjeto(id) {
    projetoSelecionado = id; // Armazena o ID globalmente
    document.getElementById('modalDeletar').classList.remove('hidden');
}

function fecharModalDeletar() {
    document.getElementById('modalDeletar').classList.add('hidden');
    projetoSelecionado = null;
}

function fecharModalMembros() {
    document.getElementById('modalMembros').classList.add('hidden');
    projetoSelecionado = null; // Limpa o projeto selecionado ao fechar o modal de membros
}

async function abrirModalMembros(id) {
    projetoSelecionado = id;
    document.getElementById('modalMembros').classList.remove('hidden');

    // Carrega a lista de usuários do sistema para o select
    try {
        const usuarios = await fazerRequisicao('/usuarios'); 
        const select = document.getElementById('selectUsuarioMembro');
        if (select && usuarios) {
            select.innerHTML = '<option value="">Selecione um usuário</option>' + usuarios.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
        }

        // Carrega os membros atuais do projeto
        carregarMembrosAtuais(id);
    } catch (erro) {
        console.error('Erro ao carregar usuários para membros:', erro);
        window.mostrarMensagem('Erro ao carregar usuários para membros', 'error');
    }
}

async function carregarMembrosAtuais(projetoId) {
    const container = document.getElementById('listaMembros');
    if (!container) return;
    container.innerHTML = '<p class="text-gray-600">Carregando membros...</p>';

    try {
        const membros = await fazerRequisicao(`/projetos/${projetoId}/membros`);

        if (!membros || membros.length === 0) {
            container.innerHTML = '<p class="text-gray-600">Nenhum membro associado.</p>';
            return;
        }

        container.innerHTML = membros.map(m => `
            <div class="flex justify-between items-center p-2 border-b">
                <span>${m.usuario_nome} (${m.papel})</span>
                <button 
                    class="btn btn-danger btn-sm btn-remover-membro" 
                    data-usuario-id="${m.usuario_id}" 
                    data-projeto-id="${projetoId}"
                >
                    Remover
                </button>
            </div>
        `).join('');

        // Adiciona event listener para os botões de remover membro (delegação)
        container.querySelectorAll('.btn-remover-membro').forEach(button => {
            button.addEventListener('click', async (event) => {
                const usuarioId = event.target.dataset.usuarioId;
                const projId = event.target.dataset.projetoId;
                if (usuarioId && projId) {
                    await removerMembro(projId, usuarioId);
                }
            });
        });

    } catch (erro) {
        console.error('Erro ao carregar membros atuais:', erro);
        container.innerHTML = '<p class="text-red-600">Erro ao carregar membros.</p>';
    }
}

async function removerMembro(projetoId, usuarioId) {
    try {
        await fazerRequisicao(`/projetos/${projetoId}/membros/${usuarioId}`, {
            method: 'DELETE'
        });
        window.mostrarMensagem('Membro removido com sucesso!', 'success');
        carregarMembrosAtuais(projetoId); // Recarrega a lista de membros
    } catch (erro) {
        console.error('Erro ao remover membro:', erro);
        window.mostrarMensagem(erro.message || 'Erro ao remover membro', 'error');
    }
}

// Funções globais que precisam ser acessíveis do HTML ou de outros módulos
// Mantendo as que você já tinha e adicionando as novas que podem ser chamadas diretamente
window.abrirModalProjeto = abrirModalProjeto;
window.fecharModalProjeto = fecharModalProjeto;
window.carregarProjetos = carregarProjetos;
window.fecharModalDeletar = fecharModalDeletar;
window.fecharModalMembros = fecharModalMembros;