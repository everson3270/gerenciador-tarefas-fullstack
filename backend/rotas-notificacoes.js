import express from 'express';
import pool from './config-db.js';
import transportador from './config-email.js';
import { verificarToken } from './middleware-auth.js';

const router = express.Router();

// Endpoint para enviar e-mail de alerta (Chamado pelo front-end a cada 60s)
router.post('/enviar', verificarToken, async (req, res) => {
    const { tarefa_id, tipo, usuario_id } = req.body;

    if (!tarefa_id || !tipo || !usuario_id) {
        return res.status(400).json({ erro: 'Campos obrigatórios em falta.' });
    }

    try {
        const connection = await pool.getConnection();

        // 1. Buscar detalhes da tarefa e o e-mail do responsável
        const [dadosTarefa] = await connection.query(
            `SELECT t.titulo, t.data_vencimento, u.email, u.nome 
             FROM tarefas t
             INNER JOIN usuarios u ON t.responsavel_id = u.id
             WHERE t.id = ?`,
            [tarefa_id]
        );

        if (dadosTarefa.length === 0) {
            connection.release();
            return res.status(404).json({ erro: 'Tarefa ou responsável não encontrado.' });
        }

        const tarefa = dadosTarefa[0];

        // 2. Definir o assunto e o corpo do e-mail com base no tipo de alerta
        let assunto = '';
        let corpoHtml = '';

        if (tipo === 'TAREFA_ATRASADA') {
            assunto = `⚠️ ALERTA: Tarefa Atrasada - ${tarefa.titulo}`;
            corpoHtml = `
                <h2>Olá, ${tarefa.nome}!</h2>
                <p>A tarefa <strong>"${tarefa.titulo}"</strong> que estava sob a sua responsabilidade encontra-se <strong>atrasada</strong>.</p>
                <p>Data de vencimento original: ${new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}</p>
                <br><p>Por favor, aceda ao sistema para atualizar o status.</p>
            `;
        } else if (tipo === 'PROXIMO_VENCIMENTO') {
            assunto = `⏰ ATENÇÃO: Vencimento Próximo - ${tarefa.titulo}`;
            corpoHtml = `
                <h2>Olá, ${tarefa.nome}!</h2>
                <p>A tarefa <strong>"${tarefa.titulo}"</strong> vence em menos de 48 horas.</p>
                <p>Data limite: ${new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}</p>
                <br><p>Organize o seu tempo para evitar atrasos!</p>
            `;
        }

        // 3. Enviar o e-mail real via Nodemailer
        let statusEnvio = 'enviado';
        try {
            await transportador.sendMail({
                from: `"Gerenciador de Tarefas" <${process.env.EMAIL_USER}>`,
                to: tarefa.email,
                subject: assunto,
                html: corpoHtml
            });
        } catch (erroEmail) {
            console.error('Erro ao disparar e-mail:', erroEmail);
            statusEnvio = 'falha';
        }

        // 4. Registar a notificação na tabela 'notificacoes' para histórico e auditoria
        await connection.query(
            `INSERT INTO notificacoes (tipo, tarefa_id, usuario_id, usuario_email, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [tipo, tarefa_id, usuario_id, tarefa.email, statusEnvio]
        );

        // 5. Se foi um aviso de 48h com sucesso, atualiza a flag na tabela tarefas para não repetir o envio
        if (tipo === 'PROXIMO_VENCIMENTO' && statusEnvio === 'enviado') {
            await connection.query(
                `UPDATE tarefas SET notificacao_48h_enviada = TRUE WHERE id = ?`,
                [tarefa_id]
            );
        }

        connection.release();

        if (statusEnvio === 'falha') {
            return res.status(500).json({ erro: 'Falha ao processar o envio físico do e-mail.' });
        }

        res.json({ mensagem: 'Notificação processada e e-mail enviado com sucesso!' });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno ao processar notificação.' });
    }
});

export default router;