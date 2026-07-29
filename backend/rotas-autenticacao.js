import express from 'express';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
import pool from './config-db.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Cadastro
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos' });
    }

    if (senha.length < 8) {
        return res.status(400).json({ erro: 'Senha deve ter no mínimo 8 caracteres' });
    }

    try {
        const connection = await pool.getConnection();

        // Verificar se email já existe
        const [usuariosExistentes] = await connection.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuariosExistentes.length > 0) {
            connection.release();
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Inserir usuário
        await connection.query(
            'INSERT INTO usuarios (nome, email, senha, perfil, status) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senhaHash, 'Usuario', 'Ativo']
        );

        connection.release();
        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    try {
        const connection = await pool.getConnection();

        const [usuarios] = await connection.query(
            'SELECT id, nome, email, senha, perfil FROM usuarios WHERE email = ? AND status = "Ativo"',
            [email]
        );

        if (usuarios.length === 0) {
            connection.release();
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = usuarios[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            connection.release();
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }

        // Gerar JWT
        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        connection.release();
        res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil
            }
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});

export default router;