import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario_id = decoded.id;
        req.perfil = decoded.perfil;
        req.nome = decoded.nome;
        next();
    } catch (erro) {
        return res.status(403).json({ erro: 'Token inválido ou expirado' });
    }
}

export function verificarPermissao(perfilRequerido) {
    return (req, res, next) => {
        if (req.perfil === 'Admin') {
            return next();
        }

        if (perfilRequerido === 'Gerente' && req.perfil !== 'Gerente') {
            return res.status(403).json({ erro: 'Apenas Gerentes podem acessar' });
        }

        next();
    };
}