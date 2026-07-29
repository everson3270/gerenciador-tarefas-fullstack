import { fazerRequisicao } from './config-api.js';

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    carregarNomeUsuario();
    carregarDashboard();
});

async function carregarDashboard() {
    try {
        // Carregar projetos
        const projetos = await fazerRequisicao('/projetos');
        const totalProjetos = projetos ? projetos.length : 0;
        const totalProjetosEl = document.getElementById('totalProjetos');
        if (totalProjetosEl) {
            totalProjetosEl.textContent = totalProjetos;
        }

        // Carregar tarefas
        const tarefas = await fazerRequisicao('/tarefas');
        if (tarefas) {
            const aFazer = tarefas.filter(t => t.status === 'A Fazer').length;
            const emAndamento = tarefas.filter(t => t.status === 'Em Andamento').length;
            const concluidas = tarefas.filter(t => t.status === 'Concluída').length;

            const aFazerEl = document.getElementById('tarefasAFazer');
            const emAndamentoEl = document.getElementById('tarefasEmAndamento');
            const concluidasEl = document.getElementById('tarefasConcluidas');

            if (aFazerEl) aFazerEl.textContent = aFazer;
            if (emAndamentoEl) emAndamentoEl.textContent = emAndamento;
            if (concluidasEl) concluidasEl.textContent = concluidas;

            atualizarTarefasAtrasadas(tarefas);
            atualizarTarefasProximas(tarefas);
        }
    } catch (erro) {
        console.error('Erro ao carregar dashboard:', erro);
        mostrarMensagem('Erro ao carregar dados do dashboard', 'error');
    }
}

function atualizarTarefasAtrasadas(tarefas) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const atrasadas = tarefas.filter(t => {
        if (t.status === 'Concluída') return false;

        const dataVencimento = new Date(t.data_vencimento);
        dataVencimento.setHours(0, 0, 0, 0);

        return dataVencimento < hoje;
    });

    const container = document.getElementById('tarefasAtrasadas');
    if (!container) return;

    if (atrasadas.length === 0) {
        container.innerHTML = '<p class="text-green-600 font-semibold">✅ Nenhuma tarefa atrasada</p>';
        return;
    }

    container.innerHTML = `
        <div class="alert alert-warning">
            <p class="font-semibold mb-3">⚠️ ${atrasadas.length} tarefa(s) atrasada(s):</p>
            ${atrasadas.map(t => `
                <div class="mb-2 p-2 bg-white rounded border-l-4 border-red-500">
                    <p class="font-semibold text-gray-800">${t.titulo}</p>
                    <p class="text-sm text-gray-600">Vencimento: ${formatarData(t.data_vencimento)}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function atualizarTarefasProximas(tarefas) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const emDoisDias = new Date(hoje);
    emDoisDias.setDate(emDoisDias.getDate() + 2);

    const proximas = tarefas.filter(t => {
        if (t.status === 'Concluída') return false;

        const dataVencimento = new Date(t.data_vencimento);
        dataVencimento.setHours(0, 0, 0, 0);

        return dataVencimento > hoje && dataVencimento <= emDoisDias;
    });

    const container = document.getElementById('tarefasProximas');
    if (!container) return;

    if (proximas.length === 0) {
        container.innerHTML = '<p class="text-blue-600 font-semibold">✅ Nenhuma tarefa próxima de vencer</p>';
        return;
    }

    container.innerHTML = `
        <div class="alert alert-info">
            <p class="font-semibold mb-3">⏰ ${proximas.length} tarefa(s) próxima(s) de vencer:</p>
            ${proximas.map(t => `
                <div class="mb-2 p-2 bg-white rounded border-l-4 border-blue-500">
                    <p class="font-semibold text-gray-800">${t.titulo}</p>
                    <p class="text-sm text-gray-600">Vencimento: ${formatarData(t.data_vencimento)}</p>
                </div>
            `).join('')}
        </div>
    `;
}

window.carregarDashboard = carregarDashboard;