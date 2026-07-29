import bcrypt from 'bcrypt';

async function gerarHashes() {
    const senhas = {
        'admin': 'admin123',
        'gerente': 'gerente123',
        'usuario': 'usuario123'
    };

    console.log('🔐 Gerando hashes de senha com bcrypt...\n');

    for (const [tipo, senha] of Object.entries(senhas)) {
        const hash = await bcrypt.hash(senha, 10);
        console.log(`${tipo.toUpperCase()}:`);
        console.log(`  Senha: ${senha}`);
        console.log(`  Hash: ${hash}\n`);
    }
}

gerarHashes().catch(err => {
    console.error('Erro ao gerar hashes:', err);
    process.exit(1);
});