import express from 'express';
import pool from './config-db.js';
import { verificarToken } from './middleware-auth.js';

const router = express.Router();

// Listar tarefas (Modificada para suportar filtros globais de projeto para Relatórios)
router.get('/', verificarToken, async (req, res) => {
    const { status, projeto_id, prioridade } = req.query;

    try {
        const connection = await pool.getConnection();

        let query = 'SELECT * FROM tarefas WHERE 1=1';
        const params = [];

        // Se filtrar por projeto_id (comum na tela de relatórios e kanban por projeto)
        if (projeto_id) {
            query += ' AND projeto_id = ?';
            params.push(projeto_id);

            // Restrição de perfil: Usuário comum só vê tarefas do projeto se fizer parte dele
            if (req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
                query += ` AND (responsavel_id = ? OR projeto_id IN (
                    SELECT projeto_id FROM projeto_membros WHERE usuario_id = ?
                ))`;
                params.push(req.usuario_id, req.usuario_id);
            }
        } else {
            // Se não especificou projeto, o comportamento padrão é trazer as tarefas do próprio usuário
            if (req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
                query += ' AND responsavel_id = ?';
                params.push(req.usuario_id);
            }
        }

        // Outros filtros opcionais
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (prioridade) {
            query += ' AND prioridade = ?';
            params.push(prioridade);
        }

        query += ' ORDER BY data_vencimento ASC';

        const [tarefas] = await connection.query(query, params);
        connection.release();
        
        res.json(tarefas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar tarefas' });
    }
});

// Criar tarefa
router.post('/', verificarToken, async (req, res) => {
    const { titulo, descricao, projeto_id, prioridade, data_vencimento } = req.body;

    if (!titulo || !projeto_id || !data_vencimento) {
        return res.status(400).json({ erro: 'Preencha os campos obrigatórios' });
    }

    try {
        const connection = await pool.getConnection();

        const [resultado] = await connection.query(
            `INSERT INTO tarefas 
             (titulo, descricao, projeto_id, responsavel_id, prioridade, status, data_vencimento) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [titulo, descricao || null, projeto_id, req.usuario_id, prioridade || 'Normal', 'A Fazer', data_vencimento]
        );

        connection.release();
        res.status(201).json({ id: resultado.insertId, mensagem: 'Tarefa criada com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao criar tarefa' });
    }
});

/// Atualizar tarefa
router.put('/:id', verificarToken, async (req, res) => {
    const { titulo, descricao, status, prioridade, data_vencimento } = req.body;
    const tarefaId = req.params.id;

    try {
        const connection = await pool.getConnection();

        
        let query = `UPDATE tarefas 
                     SET titulo = ?, descricao = ?, status = ?, prioridade = ?, data_vencimento = ? 
                     WHERE id = ?`;
        const params = [titulo, descricao, status, prioridade, data_vencimento, tarefaId];

        if (req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
            query += ' AND responsavel_id = ?';
            params.push(req.usuario_id);
        }

        const [resultado] = await connection.query(query, params);

        connection.release();

        if (resultado.affectedRows === 0) {
            return res.status(403).json({ erro: 'Tarefa não encontrada ou você não tem permissão para alterá-la' });
        }

        res.json({ mensagem: 'Tarefa atualizada com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
    }
});

// Deletar tarefa
router.delete('/:id', verificarToken, async (req, res) => {
    const tarefaId = req.params.id;

    try {
        const connection = await pool.getConnection();

        
        let query = 'DELETE FROM tarefas WHERE id = ?';
        const params = [tarefaId];

        if (req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
            query += ' AND responsavel_id = ?';
            params.push(req.usuario_id);
        }

        const [resultado] = await connection.query(query, params);

        connection.release();

        if (resultado.affectedRows === 0) {
            return res.status(403).json({ erro: 'Tarefa não encontrada ou você não tem permissão para eliminá-la' });
        }

        res.json({ mensagem: 'Tarefa eliminada com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao eliminar tarefa' });
    }
});

export default router;