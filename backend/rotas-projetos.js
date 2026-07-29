// rotas-projetos.js
import express from 'express';
import pool from './config-db.js';
import { verificarToken, verificarPermissao } from './middleware-auth.js';

const router = express.Router();

// Listar projetos do usuário
router.get('/', verificarToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [projetos] = await connection.query(
            `SELECT p.* FROM projetos p 
             WHERE p.criador_id = ? OR p.id IN (
                SELECT projeto_id FROM projeto_membros WHERE usuario_id = ?
             )
             ORDER BY p.data_criacao DESC`,
            [req.usuario_id, req.usuario_id]
        );

        connection.release();
        res.json(projetos);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar projetos' });
    }
});

// Criar projeto (apenas Gerente)
router.post('/', verificarToken, verificarPermissao('Gerente'), async (req, res) => {
    const { nome, descricao, data_inicio, data_fim } = req.body;

    if (!nome || !data_inicio || !data_fim) {
        return res.status(400).json({ erro: 'Preencha os campos obrigatórios' });
    }

    try {
        const connection = await pool.getConnection();

        const [resultado] = await connection.query(
            'INSERT INTO projetos (nome, descricao, criador_id, status, data_inicio, data_fim) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, descricao || null, req.usuario_id, 'Ativo', data_inicio, data_fim]
        );

        connection.release();
        res.status(201).json({ id: resultado.insertId, mensagem: 'Projeto criado com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao criar projeto' });
    }
});

// Atualizar projeto
router.put('/:id', verificarToken, async (req, res) => {
    const { nome, descricao, data_inicio, data_fim, status } = req.body;
    const projetoId = req.params.id;

    try {
        const connection = await pool.getConnection();

        // Verifica se o usuário logado é o criador do projeto ou Admin/Gerente
        const [projeto] = await connection.query(
            'SELECT criador_id FROM projetos WHERE id = ?',
            [projetoId]
        );

        if (projeto.length === 0) {
            connection.release();
            return res.status(404).json({ erro: 'Projeto não encontrado.' });
        }

        if (projeto[0].criador_id !== req.usuario_id && req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
            connection.release();
            return res.status(403).json({ erro: 'Você não tem permissão para atualizar este projeto.' });
        }

        await connection.query(
            'UPDATE projetos SET nome = ?, descricao = ?, data_inicio = ?, data_fim = ?, status = ? WHERE id = ?',
            [nome, descricao, data_inicio, data_fim, status, projetoId]
        );

        connection.release();
        res.json({ mensagem: 'Projeto atualizado com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar projeto' });
    }
});

// Deletar projeto
router.delete('/:id', verificarToken, async (req, res) => {
    const projetoId = req.params.id;

    try {
        const connection = await pool.getConnection();

        // Verifica se o usuário logado é o criador do projeto ou Admin/Gerente
        const [projeto] = await connection.query(
            'SELECT criador_id FROM projetos WHERE id = ?',
            [projetoId]
        );

        if (projeto.length === 0) {
            connection.release();
            return res.status(404).json({ erro: 'Projeto não encontrado.' });
        }

        if (projeto[0].criador_id !== req.usuario_id && req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
            connection.release();
            return res.status(403).json({ erro: 'Você não tem permissão para deletar este projeto.' });
        }

        await connection.query(
            'DELETE FROM projetos WHERE id = ?',
            [projetoId]
        );

        connection.release();
        res.json({ mensagem: 'Projeto deletado com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao deletar projeto' });
    }
});

// ====================================================================================================
// ROTAS DE MEMBROS DO PROJETO
// ====================================================================================================

// Listar membros de um projeto específico
router.get('/:id/membros', verificarToken, async (req, res) => {
    const projetoId = req.params.id;

    try {
        const connection = await pool.getConnection();

        // Verifica se o usuário logado tem permissão para ver os membros deste projeto
        // Ele deve ser o criador do projeto ou um membro do projeto, ou Admin/Gerente
        const [permissao] = await connection.query(
            `SELECT 1 FROM projetos WHERE id = ? AND criador_id = ?
             UNION
             SELECT 1 FROM projeto_membros WHERE projeto_id = ? AND usuario_id = ?`,
            [projetoId, req.usuario_id, projetoId, req.usuario_id]
        );

        if (permissao.length === 0 && req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
            connection.release();
            return res.status(403).json({ erro: 'Você não tem permissão para ver os membros deste projeto.' });
        }

        // Busca os membros do projeto, incluindo o nome do usuário
        const [membros] = await connection.query(
            `SELECT pm.usuario_id, u.nome AS usuario_nome, pm.papel
             FROM projeto_membros pm
             JOIN usuarios u ON pm.usuario_id = u.id
             WHERE pm.projeto_id = ?
             ORDER BY u.nome ASC`,
            [projetoId]
        );

        connection.release();
        res.json(membros);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao listar membros do projeto' });
    }
});

// Adicionar membro ao projeto
router.post('/:id/membros', verificarToken, async (req, res) => {
    const { usuario_id, papel } = req.body;
    const projetoId = req.params.id;

    if (!usuario_id) {
        return res.status(400).json({ erro: 'usuario_id é obrigatório' });
    }

    try {
        const connection = await pool.getConnection();

        // Verifica se o usuário logado tem permissão para adicionar membros a este projeto
        // Ex: Apenas o criador do projeto ou um gerente/admin
        const [projeto] = await connection.query(
            'SELECT criador_id FROM projetos WHERE id = ?',
            [projetoId]
        );

        if (projeto.length === 0) {
            connection.release();
            return res.status(404).json({ erro: 'Projeto não encontrado.' });
        }

        if (projeto[0].criador_id !== req.usuario_id && req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
            connection.release();
            return res.status(403).json({ erro: 'Você não tem permissão para adicionar membros a este projeto.' });
        }

        // Verificar se o membro já existe no projeto
        const [membroExistente] = await connection.query(
            'SELECT 1 FROM projeto_membros WHERE projeto_id = ? AND usuario_id = ?',
            [projetoId, usuario_id]
        );

        if (membroExistente.length > 0) {
            connection.release();
            return res.status(409).json({ erro: 'Usuário já é membro deste projeto.' });
        }

        await connection.query(
            'INSERT INTO projeto_membros (projeto_id, usuario_id, papel) VALUES (?, ?, ?)',
            [projetoId, usuario_id, papel || 'MEMBRO'] // Papel padrão 'MEMBRO'
        );

        connection.release();
        res.status(201).json({ mensagem: 'Membro adicionado com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao adicionar membro' });
    }
});

// Remover membro do projeto
router.delete('/:id/membros/:usuario_id', verificarToken, async (req, res) => {
    const { id, usuario_id } = req.params;
    const projetoId = id; // Renomeando para clareza

    try {
        const connection = await pool.getConnection();

        // Verifica se o usuário logado tem permissão para remover membros deste projeto
        // Ex: Apenas o criador do projeto ou um gerente/admin
        const [projeto] = await connection.query(
            'SELECT criador_id FROM projetos WHERE id = ?',
            [projetoId]
        );

        if (projeto.length === 0) {
            connection.release();
            return res.status(404).json({ erro: 'Projeto não encontrado.' });
        }

        if (projeto[0].criador_id !== req.usuario_id && req.perfil !== 'Admin' && req.perfil !== 'Gerente') {
            connection.release();
            return res.status(403).json({ erro: 'Você não tem permissão para remover membros deste projeto.' });
        }

        // Impede que o criador do projeto seja removido (se ele for membro)
        if (projeto[0].criador_id == usuario_id) {
            connection.release();
            return res.status(400).json({ erro: 'O criador do projeto não pode ser removido como membro.' });
        }

        const [resultado] = await connection.query(
            'DELETE FROM projeto_membros WHERE projeto_id = ? AND usuario_id = ?',
            [projetoId, usuario_id]
        );

        connection.release();

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Membro não encontrado neste projeto.' });
        }

        res.json({ mensagem: 'Membro removido com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover membro' });
    }
});

export default router;