// rotas-usuarios.js
import express from 'express';
import pool from './config-db.js';
import { verificarToken } from './middleware-auth.js';

const router = express.Router();

// Listar todos os usuários (acessível por qualquer usuário autenticado)
// Esta rota é para popular dropdowns, então não precisa de todos os detalhes sensíveis
router.get('/', verificarToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        // Seleciona apenas id, nome e email para o dropdown, e apenas usuários ativos
        const [usuarios] = await connection.query(
            'SELECT id, nome, email FROM usuarios WHERE status = "Ativo" ORDER BY nome ASC'
        );
        connection.release();
        res.json(usuarios);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar usuários' });
    }
});

export default router;