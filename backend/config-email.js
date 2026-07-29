import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do transportador de e-mail (usando SMTP configurado no .env)
const transportador = nodemailer.createTransport({
    service: 'gmail', // Ou configure host/port se não for usar o Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Senha de app gerada no painel do Google
    }
});

// Verificar se a conexão com o servidor de e-mail está a funcionar (opcional para debug)
transportador.verify((erro) => {
    if (erro) {
        console.error('❌ Erro na configuração do Nodemailer:', erro.message);
    } else {
        console.log('📧 Nodemailer pronto para enviar notificações.');
    }
});

export default transportador;