import express from 'express';
import pool from './config-db.js';
import { verificarToken, verificarPermissao } from './middleware-auth.js';

const router = express.Router();

// Listar todos os usuários (apenas Admin)
router.get('/usuarios', verificarToken, verificarPermissao('Admin'), async (req, res) => {
    const { perfil, status } = req.query;

    try {
        const connection = await pool.getConnection();

        let query = 'SELECT id, nome, email, perfil, status, data_criacao FROM usuarios';
        const params = [];

        if (perfil) {
            query += ' WHERE perfil = ?';
            params.push(perfil);
        }

        if (status) {
            query += params.length > 0 ? ' AND status = ?' : ' WHERE status = ?';
            params.push(status);
        }

        const [usuarios] = await connection.query(query, params);

        connection.release();
        res.json(usuarios);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
});

// Atualizar perfil e status do usuário (apenas Admin)
router.put('/usuarios/:id', verificarToken, verificarPermissao('Admin'), async (req, res) => {
    const { perfil, status } = req.body;
    const usuarioId = req.params.id;

    if (!perfil || !status) {
        return res.status(400).json({ erro: 'Preencha todos os campos' });
    }

    try {
        const connection = await pool.getConnection();

        await connection.query(
            'UPDATE usuarios SET perfil = ?, status = ? WHERE id = ?',
            [perfil, status, usuarioId]
        );

        connection.release();
        res.json({ mensagem: 'Usuário atualizado com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar usuário' });
    }
});

// Desativar usuário (apenas Admin)
router.delete('/usuarios/:id', verificarToken, verificarPermissao('Admin'), async (req, res) => {
    const usuarioId = req.params.id;

    try {
        const connection = await pool.getConnection();

        await connection.query(
            'UPDATE usuarios SET status = "Inativo" WHERE id = ?',
            [usuarioId]
        );

        connection.release();
        res.json({ mensagem: 'Usuário desativado com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao desativar usuário' });
    }
});

export default router;