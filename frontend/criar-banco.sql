-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS gerenciador_tarefas;
USE gerenciador_tarefas;

-- Tabela de Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('Usuario', 'Gerente', 'Admin') DEFAULT 'Usuario',
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_perfil (perfil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Projetos
CREATE TABLE projetos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    criador_id INT NOT NULL,
    status ENUM('Ativo', 'Inativo', 'Concluído') DEFAULT 'Ativo',
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_criador (criador_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Associação Usuários-Projetos
CREATE TABLE projeto_membros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    projeto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    papel ENUM('Membro', 'Líder') DEFAULT 'Membro',
    data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_projeto_usuario (projeto_id, usuario_id),
    INDEX idx_projeto (projeto_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Tarefas
CREATE TABLE tarefas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    projeto_id INT NOT NULL,
    responsavel_id INT NOT NULL,
    status ENUM('A Fazer', 'Em Andamento', 'Concluída') DEFAULT 'A Fazer',
    prioridade ENUM('Baixa', 'Normal', 'Alta', 'Urgente') DEFAULT 'Normal',
    data_vencimento DATE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notificacao_48h_enviada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_projeto (projeto_id),
    INDEX idx_responsavel (responsavel_id),
    INDEX idx_status (status),
    INDEX idx_vencimento (data_vencimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Notificações
CREATE TABLE notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('PROXIMO_VENCIMENTO', 'TAREFA_ATRASADA') NOT NULL,
    tarefa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    usuario_email VARCHAR(255) NOT NULL,
    status ENUM('enviado', 'pendente', 'falha') DEFAULT 'pendente',
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuário Admin para testes
INSERT INTO usuarios (nome, email, senha, perfil, status) VALUES
('Administrador', 'admin@example.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'Ativo'),
('Gerente Teste', 'gerente@example.com', '$2a$10$YourHashedPasswordHere', 'Gerente', 'Ativo'),
('Usuário Teste', 'usuario@example.com', '$2a$10$YourHashedPasswordHere', 'Usuario', 'Ativo');