// tarefas.js
import { fazerRequisicao } from './config-api.js';

let tarefaEmEdicao = null;
let tarefaIdParaExcluir = null; // Variável para armazenar o ID da tarefa a ser excluída

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    carregarNomeUsuario();
    carregarProjetos();
    carregarTarefas();
    carregarUsuariosParaResponsavel(); // <--- ADICIONADO: Chama a função para carregar usuários

    const formTarefa = document.getElementById('formTarefa');
    if (formTarefa) {
        formTarefa.addEventListener('submit', salvarTarefa);
    }

    const filtroStatus = document.getElementById('filtroStatus');
    const filtroProjeto = document.getElementById('filtroProjeto');
    const filtroPrioridade = document.getElementById('filtroPrioridade');

    if (filtroStatus) filtroStatus.addEventListener('change', carregarTarefas);
    if (filtroProjeto) filtroProjeto.addEventListener('change', carregarTarefas);
    if (filtroPrioridade) filtroPrioridade.addEventListener('change', carregarTarefas);
});

async function carregarProjetos() {
    try {
        const projetos = await fazerRequisicao('/projetos');

        const select = document.getElementById('filtroProjeto');
        if (select && projetos) {
            select.innerHTML = '<option value="">Todos</option>' +
                projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }

        const selectTarefa = document.getElementById('tarefaProjeto');
        if (selectTarefa && projetos) {
            selectTarefa.innerHTML =
                projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }
    } catch (erro) {
        console.error('Erro ao carregar projetos:', erro);
    }
}

// <--- NOVA FUNÇÃO: Para carregar usuários e preencher o dropdown de responsável
async function carregarUsuariosParaResponsavel() {
    try {
        const usuarios = await fazerRequisicao('/usuarios'); // Requisição para o backend
        const selectResponsavel = document.getElementById('selectResponsavel');

        if (selectResponsavel && usuarios && usuarios.length > 0) {
            selectResponsavel.innerHTML = '<option value="">Selecione um responsável</option>'; // Opção padrão
            usuarios.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id;
                option.textContent = usuario.nome;
                selectResponsavel.appendChild(option);
            });
        } else if (selectResponsavel) {
            selectResponsavel.innerHTML = '<option value="">Nenhum usuário disponível</option>';
        }
    } catch (erro) {
        console.error('Erro ao carregar usuários para o dropdown de responsável:', erro);
        mostrarMensagem('Erro ao carregar responsáveis.', 'error');
        const selectResponsavel = document.getElementById('selectResponsavel');
        if (selectResponsavel) {
            selectResponsavel.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
}
// <--- FIM DA NOVA FUNÇÃO

async function carregarTarefas() {
    try {
        const filtroStatus = document.getElementById('filtroStatus')?.value || '';
        const filtroProjeto = document.getElementById('filtroProjeto')?.value || '';
        const filtroPrioridade = document.getElementById('filtroPrioridade')?.value || '';

        let endpoint = '/tarefas';
        const params = new URLSearchParams();

        if (filtroStatus) params.append('status', filtroStatus);
        if (filtroProjeto) params.append('projeto_id', filtroProjeto);
        if (filtroPrioridade) params.append('prioridade', filtroPrioridade);

        if (params.toString()) {
            endpoint += '?' + params.toString();
        }

        const tarefas = await fazerRequisicao(endpoint);

        const tbody = document.querySelector('tbody');
        if (!tbody) return;

        if (!tarefas || tarefas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Nenhuma tarefa encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = tarefas.map(tarefa => `
            <tr class="fade-in">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${tarefa.titulo}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tarefa.projeto_nome || 'Sem projeto'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tarefa.responsavel_nome || 'Não atribuído'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                        onchange="atualizarStatusTarefa('${tarefa.id}', this.value)"
                        class="px-2 py-1 border rounded ${
                            tarefa.status === 'Concluída' ? 'bg-green-100 text-green-800' :
                            tarefa.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        } appearance-none"
                    >
                        <option value="A Fazer" ${tarefa.status === 'A Fazer' ? 'selected' : ''}>A Fazer</option>
                        <option value="Em Andamento" ${tarefa.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                        <option value="Concluída" ${tarefa.status === 'Concluída' ? 'selected' : ''}>Concluída</option>
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="px-3 py-1 rounded text-white text-sm ${
                        tarefa.prioridade === 'Urgente' ? 'bg-red-500' :
                        tarefa.prioridade === 'Alta' ? 'bg-orange-500' :
                        tarefa.prioridade === 'Normal' ? 'bg-blue-500' :
                        'bg-green-500'
                    }">
                        ${tarefa.prioridade}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatarData(tarefa.data_vencimento)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        onclick="editarTarefa('${tarefa.id}')"
                        class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded mr-2 transition"
                    >
                        ✏️
                    </button>
                    <button
                        onclick="abrirModalConfirmacaoExclusao('${tarefa.id}')"
                        class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition"
                    >
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (erro) {
        console.error('Erro ao carregar tarefas:', erro);
        const tbody = document.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center">Erro ao carregar tarefas.</td></tr>';
        }
    }
}

function abrirModalTarefa() {
    tarefaEmEdicao = null;
    document.getElementById('modalTituloTarefa').textContent = 'Nova Tarefa';
    document.getElementById('formTarefa').reset();
    document.getElementById('modalTarefa').classList.remove('hidden');
    // Opcional: Recarregar usuários e projetos ao abrir o modal, caso a lista possa mudar
    // carregarUsuariosParaResponsavel();
    // carregarProjetos(); // Se o dropdown de projeto estiver no modal
}

function fecharModalTarefa() {
    document.getElementById('modalTarefa').classList.add('hidden');
}

async function salvarTarefa(event) {
    event.preventDefault();

    const titulo = document.getElementById('tarefaTitulo').value;
    const descricao = document.getElementById('tarefaDescricao').value;
    const projeto_id = document.getElementById('tarefaProjeto').value;
    const responsavel_id = document.getElementById('selectResponsavel').value; // <--- ADICIONADO: Pega o ID do responsável
    const prioridade = document.getElementById('tarefaPrioridade').value;
    const data_vencimento = document.getElementById('tarefaDataVencimento').value;

    if (!titulo || !projeto_id || !responsavel_id || !data_vencimento) { // <--- ADICIONADO: Valida o responsável
        mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        if (tarefaEmEdicao) {
            // Se estiver editando, você pode querer permitir a mudança de responsável
            // ou manter o atual. Por enquanto, a rota PUT do backend não espera responsavel_id.
            // Se quiser mudar, precisaria ajustar a rota PUT no rotastarefas.js também.
            await fazerRequisicao(`/tarefas/${tarefaEmEdicao}`, {
                method: 'PUT',
                body: JSON.stringify({ titulo, descricao, prioridade, data_vencimento, responsavel_id }) // <--- ADICIONADO responsavel_id na edição
            });
            mostrarMensagem('Tarefa atualizada com sucesso!', 'success');
        } else {
            await fazerRequisicao('/tarefas', {
                method: 'POST',
                body: JSON.stringify({
                    titulo,
                    descricao,
                    projeto_id,
                    responsavel_id, // <--- ADICIONADO: Envia o ID do responsável
                    prioridade,
                    data_vencimento
                })
            });
            mostrarMensagem('Tarefa criada com sucesso!', 'success');
        }

        fecharModalTarefa();
        carregarTarefas();
    } catch (erro) {
        console.error('Erro ao salvar tarefa:', erro);
        mostrarMensagem(erro.message || 'Erro ao salvar tarefa', 'error');
    }
}

async function editarTarefa(id) {
    try {
        // É mais eficiente ter uma rota GET /tarefas/:id no backend para pegar uma única tarefa
        // Por enquanto, estamos filtrando do array de todas as tarefas, o que funciona para pequenas quantidades.
        const tarefas = await fazerRequisicao('/tarefas');
        const tarefa = tarefas.find(t => t.id == id);

        if (tarefa) {
            tarefaEmEdicao = id;
            document.getElementById('modalTituloTarefa').textContent = 'Editar Tarefa';
            document.getElementById('tarefaTitulo').value = tarefa.titulo;
            document.getElementById('tarefaDescricao').value = tarefa.descricao || '';
            document.getElementById('tarefaProjeto').value = tarefa.projeto_id;
            document.getElementById('selectResponsavel').value = tarefa.responsavel_id; // <--- ADICIONADO: Preenche o responsável
            document.getElementById('tarefaPrioridade').value = tarefa.prioridade;
            document.getElementById('tarefaDataVencimento').value = formatarDataInput(tarefa.data_vencimento);

            document.getElementById('modalTarefa').classList.remove('hidden');
        }
    } catch (erro) {
        console.error('Erro ao carregar tarefa para edição:', erro);
        mostrarMensagem('Erro ao carregar tarefa', 'error');
    }
}

// Funções para o modal de confirmação de exclusão
function abrirModalConfirmacaoExclusao(id) {
    tarefaIdParaExcluir = id;
    document.getElementById('modalConfirmacaoExclusao').classList.remove('hidden');
}

function fecharModalConfirmacaoExclusao() {
    tarefaIdParaExcluir = null;
    document.getElementById('modalConfirmacaoExclusao').classList.add('hidden');
}

async function confirmarExclusaoTarefa() {
    if (!tarefaIdParaExcluir) {
        mostrarMensagem('Nenhuma tarefa selecionada para exclusão.', 'error');
        return;
    }

    try {
        await fazerRequisicao(`/tarefas/${tarefaIdParaExcluir}`, {
            method: 'DELETE'
        });
        carregarTarefas();
        mostrarMensagem('Tarefa deletada com sucesso!', 'success');
        fecharModalConfirmacaoExclusao(); // Fecha o modal após a exclusão
    } catch (erro) {
        console.error('Erro ao deletar tarefa:', erro);
        mostrarMensagem('Erro ao deletar tarefa', 'error');
    }
}

async function atualizarStatusTarefa(id, novoStatus) {
    try {
        await fazerRequisicao(`/tarefas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: novoStatus })
        });
        carregarTarefas();
    } catch (erro) {
        console.error('Erro ao atualizar status da tarefa:', erro);
        mostrarMensagem('Erro ao atualizar status da tarefa', 'error');
    }
}

// Exportar funções globais para o navegador encontrar no onclick do HTML
window.abrirModalTarefa = abrirModalTarefa;
window.fecharModalTarefa = fecharModalTarefa;
window.editarTarefa = editarTarefa;
window.abrirModalConfirmacaoExclusao = abrirModalConfirmacaoExclusao; // Exporta a nova função
window.fecharModalConfirmacaoExclusao = fecharModalConfirmacaoExclusao; // Exporta a nova função
window.confirmarExclusaoTarefa = confirmarExclusaoTarefa; // Exporta a nova função
window.atualizarStatusTarefa = atualizarStatusTarefa;
window.carregarTarefas = carregarTarefas;
// Certifique-se de que formatarData e formatarDataInput estão definidas em algum lugar
// ou importadas, pois são usadas aqui.