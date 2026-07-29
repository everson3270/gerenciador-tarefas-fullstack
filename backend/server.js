import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rotasAutenticacao from './rotas-autenticacao.js';
import rotasProjetos from './rotas-projetos.js';
import rotasTarefas from './rotas-tarefas.js';
import rotasAdmin from './rotas-admin.js';
import rotasNotificacoes from './rotas-notificacoes.js';
import rotasUsuarios from './rotas-usuarios.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', rotasAutenticacao);
app.use('/api/projetos', rotasProjetos);
app.use('/api/tarefas', rotasTarefas);
app.use('/api/admin', rotasAdmin);
app.use('/api/notificacoes', rotasNotificacoes);
app.use('/api/usuarios', rotasUsuarios);

// Rota de teste
app.get('/api/teste', (req, res) => {
    res.json({ mensagem: 'Servidor funcionando corretamente!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});