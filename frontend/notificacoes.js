import { fazerRequisicao } from './config-api.js';

class SistemaNotificacoes {
    constructor() {
        this.intervaloVerificacao = 60000; // 1 minuto
        this.iniciarVerificacao();
    }

    iniciarVerificacao() {
        setInterval(() => {
            this.verificarTarefasProximas();
            this.verificarTarefasAtrasadas();
        }, this.intervaloVerificacao);
    }

    async verificarTarefasProximas() {
        try {
            const tarefas = await fazerRequisicao('/tarefas');

            if (!tarefas) return;

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const emDoisDias = new Date(hoje);
            emDoisDias.setDate(emDoisDias.getDate() + 2);

            tarefas.forEach(async (tarefa) => {
                if (tarefa.status === 'Concluída') return;

                const dataVencimento = new Date(tarefa.data_vencimento);
                dataVencimento.setHours(0, 0, 0, 0);

                // Se a tarefa vence em até 48 horas
                if (dataVencimento <= emDoisDias && dataVencimento > hoje) {
                    // Verificar se já foi notificado
                    if (!tarefa.notificacao_48h_enviada) {
                        await this.enviarAlerta(tarefa, 'PROXIMO_VENCIMENTO');
                    }
                }
            });
        } catch (erro) {
            console.error('Erro ao verificar tarefas próximas:', erro);
        }
    }

    async verificarTarefasAtrasadas() {
        try {
            const tarefas = await fazerRequisicao('/tarefas');

            if (!tarefas) return;

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            tarefas.forEach(async (tarefa) => {
                if (tarefa.status === 'Concluída') return;

                const dataVencimento = new Date(tarefa.data_vencimento);
                dataVencimento.setHours(0, 0, 0, 0);

                // Se a tarefa está atrasada
                if (dataVencimento < hoje) {
                    await this.enviarAlerta(tarefa, 'TAREFA_ATRASADA');
                }
            });
        } catch (erro) {
            console.error('Erro ao verificar tarefas atrasadas:', erro);
        }
    }

    async enviarAlerta(tarefa, tipo) {
        try {
            // Enviar notificação via API do back-end
            await fazerRequisicao('/notificacoes/enviar', {
                method: 'POST',
                body: JSON.stringify({
                    tarefa_id: tarefa.id,
                    tipo: tipo,
                    usuario_id: tarefa.responsavel_id
                })
            });

            console.log(`✅ Notificação enviada para tarefa: ${tarefa.titulo}`);

        } catch (erro) {
            console.error('Erro ao enviar alerta:', erro);
        }
    }

    exibirNotificacaoLocal(titulo, opcoes = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(titulo, opcoes);
        }
    }
}

// Solicitar permissão para notificações do navegador
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Inicializar sistema de notificações
const sistemaNotificacoes = new SistemaNotificacoes();

// Exportar para uso global
window.SistemaNotificacoes = SistemaNotificacoes;
window.sistemaNotificacoes = sistemaNotificacoes;