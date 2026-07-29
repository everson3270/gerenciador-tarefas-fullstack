import { fazerRequisicao } from './config-api.js';

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
    carregarNomeUsuario();
    carregarProjetos();
});

async function carregarProjetos() {
    try {
        const projetos = await fazerRequisicao('/projetos');

        const select = document.getElementById('selectProjeto');
        if (select && projetos) {
            select.innerHTML = '<option value="">Selecione um projeto</option>' +
                projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        }
    } catch (erro) {
        console.error('Erro ao carregar projetos:', erro);
    }
}

async function gerarRelatorioPDF() {
    const projetoId = document.getElementById('selectProjeto').value;

    if (!projetoId) {
        mostrarMensagem('Selecione um projeto', 'error');
        return;
    }

    try {
        // Buscar dados do projeto
        const projetos = await fazerRequisicao('/projetos');
        const projeto = projetos.find(p => p.id == projetoId);

        if (!projeto) {
            mostrarMensagem('Projeto não encontrado', 'error');
            return;
        }

        // Buscar tarefas do projeto
        const tarefas = await fazerRequisicao(`/tarefas?projeto_id=${projetoId}`);

        // Gerar PDF
        gerarPDFComDados(projeto, tarefas || []);

    } catch (erro) {
        console.error('Erro ao gerar relatório:', erro);
        mostrarMensagem('Erro ao gerar relatório', 'error');
    }
}

function gerarPDFComDados(projeto, tarefas) {
    // Verificar se jsPDF está disponível
    if (typeof jspdf === 'undefined') {
        mostrarMensagem('Biblioteca jsPDF não carregada. Verifique a conexão com a internet.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE PROJETO', margin, yPosition);

    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Projeto: ${projeto.nome}`, margin, yPosition);

    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Descrição: ${projeto.descricao || 'Sem descrição'}`, margin, yPosition);

    yPosition += 8;
    doc.text(`Status: ${projeto.status}`, margin, yPosition);

    yPosition += 8;
    doc.text(`Início: ${formatarData(projeto.data_inicio)} | Término: ${formatarData(projeto.data_fim)}`, margin, yPosition);

    yPosition += 15;

    // Seção de Tarefas
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TAREFAS', margin, yPosition);

    yPosition += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    if (tarefas.length === 0) {
        doc.text('Nenhuma tarefa cadastrada', margin, yPosition);
    } else {
        // Cabeçalho da tabela
        doc.setFont(undefined, 'bold');
        doc.text('Título', margin, yPosition);
        doc.text('Status', margin + 80, yPosition);
        doc.text('Prioridade', margin + 120, yPosition);
        doc.text('Vencimento', margin + 160, yPosition);

        yPosition += 8;
        doc.setFont(undefined, 'normal');

        tarefas.forEach(tarefa => {
            if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
            }

            doc.text(tarefa.titulo.substring(0, 30), margin, yPosition);
            doc.text(tarefa.status, margin + 80, yPosition);
            doc.text(tarefa.prioridade, margin + 120, yPosition);
            doc.text(formatarData(tarefa.data_vencimento), margin + 160, yPosition);

            yPosition += 8;
        });
    }

    // Rodapé
    yPosition = pageHeight - 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);

    // Salvar PDF
    doc.save(`relatorio-${projeto.nome}-${new Date().getTime()}.pdf`);

    mostrarMensagem('Relatório gerado com sucesso!', 'success');
}

// Exportar funções globais
window.gerarRelatorioPDF = gerarRelatorioPDF;