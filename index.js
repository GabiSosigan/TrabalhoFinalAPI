const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {z} = require('zod');

const JWT_SECRET = 'grace_rocky_save_stars';

const livroSchema = z.object({
    nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    preco: z.number().positive("O preço deve ser maior que zero"),
    genero: z.string().min(2, "Gênero é obrigatório"),
    paginas: z.number().int().positive("Páginas devem ser um número inteiro positivo"),
    autor_id: z.number().int().positive("ID do autor inválido")
});

const app = express();
app.use(express.json());

let db;

function verificarToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

    jwt.verify(token.replace('Bearer ', ''), JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ erro: 'Token inválido' });
        req.usuarioId = decoded.id;
        next();
    });
}

async function configurarBanco() {
    db = await open({
        filename: './banco.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            senha TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS autores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS livros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            preco REAL NOT NULL,
            genero TEXT NOT NULL,
            paginas INTEGER NOT NULL,
            autor_id INTEGER,
            FOREIGN KEY (autor_id) REFERENCES autores(id)
        );
    `);

    const qtdeLivros = await db.get('SELECT COUNT(*) as count FROM livros');
    
    if (qtdeLivros.count === 0) {
        console.log('Banco vazio. Inserindo registros iniciais...');

        const senhaHash = await bcrypt.hash('senha123', 10);
        await db.run('INSERT INTO usuarios (username, senha) VALUES (?, ?)', ['admin', senhaHash]);
        
        const autores = ['Antoine de Saint-Exupéry', 'Stephen King', 'J.R.R. Tolkien', 'George Orwell', 'Machado de Assis'];
        for (const autor of autores) {
            await db.run('INSERT INTO autores (nome) VALUES (?)', [autor]);
        }

        const livrosSementes = [
            { nome: "O Pequeno Príncipe", preco: 20, genero: "Fábula", paginas: 120, autor_id: 1 },
            { nome: "It: A Coisa", preco: 120, genero: "Terror", paginas: 1104, autor_id: 2 },
            { nome: "O Iluminado", preco: 80, genero: "Terror", paginas: 464, autor_id: 2 },
            { nome: "O Hobbit", preco: 50, genero: "Fantasia", paginas: 340, autor_id: 3 },
            { nome: "A Sociedade do Anel", preco: 60, genero: "Fantasia", paginas: 576, autor_id: 3 },
            { nome: "As Duas Torres", preco: 60, genero: "Fantasia", paginas: 464, autor_id: 3 },
            { nome: "O Retorno do Rei", preco: 65, genero: "Fantasia", paginas: 528, autor_id: 3 },
            { nome: "1984", preco: 30, genero: "Ficção Distópica", paginas: 400, autor_id: 4 },
            { nome: "A Revolução dos Bichos", preco: 25, genero: "Ficção", paginas: 152, autor_id: 4 },
            { nome: "Dom Casmurro", preco: 35, genero: "Romance", paginas: 256, autor_id: 5 },
            { nome: "Memórias Póstumas", preco: 40, genero: "Romance", paginas: 320, autor_id: 5 },
            { nome: "A Dança da Morte", preco: 90, genero: "Ficção", paginas: 1248, autor_id: 2 },
            { nome: "O Silmarillion", preco: 70, genero: "Fantasia", paginas: 480, autor_id: 3 },
            { nome: "Contos Inacabados", preco: 55, genero: "Fantasia", paginas: 624, autor_id: 3 },
            { nome: "Misery", preco: 45, genero: "Suspense", paginas: 328, autor_id: 2 },
            { nome: "A Espera de um Milagre", preco: 50, genero: "Drama", paginas: 400, autor_id: 2 },
            { nome: "Na Pior em Paris e Londres", preco: 35, genero: "Autobiografia", paginas: 240, autor_id: 4 },
            { nome: "Quincas Borba", preco: 30, genero: "Romance", paginas: 280, autor_id: 5 },
            { nome: "O Alienista", preco: 20, genero: "Conto", paginas: 96, autor_id: 5 },
            { nome: "Correio Sul", preco: 28, genero: "Romance", paginas: 160, autor_id: 1 }
        ];

        for (const livro of livrosSementes) {
            await db.run(
                'INSERT INTO livros (nome, preco, genero, paginas, autor_id) VALUES (?, ?, ?, ?, ?)',
                [livro.nome, livro.preco, livro.genero, livro.paginas, livro.autor_id]
            );
        }
        console.log('Dados iniciais inseridos');
    } else {
        console.log('Banco de dados já possui registros.');
    }
}

/**
 * Rota GET
*/

app.get('/api/livros', async (req, res) => {
    try {
        const { genero, ordem = 'nome', direcao = 'asc', pagina = 1, limite = 10 } = req.query;
        
        const limit = parseInt(limite);
        const offset = (parseInt(pagina) - 1) * limit;

        let sql = `
            SELECT livros.*, autores.nome as autor_nome 
            FROM livros 
            JOIN autores ON livros.autor_id = autores.id 
            WHERE 1=1
        `;
        const params = [];

        if (genero) {
            sql += ` AND livros.genero = ?`;
            params.push(genero);
        }

        const direcaoSql = direcao.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const camposValidos = ['nome', 'preco'];
        const campoOrdem = camposValidos.includes(ordem) ? `livros.${ordem}` : 'livros.nome';
        
        sql += ` ORDER BY ${campoOrdem} ${direcaoSql} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const resultados = await db.all(sql, params);
        const total = await db.get(`SELECT COUNT(*) as count FROM livros`);

        res.json({
            dados: resultados,
            paginacao: {
                pagina_atual: parseInt(pagina),
                itens_por_pagina: limit,
                total_itens: total.count,
                total_paginas: Math.ceil(total.count / limit)
            }
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

/**
 * LOGIN
*/

app.post('/api/login', async (req, res) => {
    const { username, senha } = req.body;
    const usuario = await db.get('SELECT * FROM usuarios WHERE username = ?', [username]);

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
        return res.status(401).json({ erro: 'Credenciais inválidas!' });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

/**
 * Rota POST
*/

app.post('/api/livros', verificarToken, async (req, res) => {
    try {
        const dadosValidados = livroSchema.parse(req.body);
        
        const autorExiste = await db.get('SELECT id FROM autores WHERE id = ?', [dadosValidados.autor_id]);
        if (!autorExiste) return res.status(404).json({ erro: 'Autor não encontrado' });

        const result = await db.run(
            'INSERT INTO livros (nome, preco, genero, paginas, autor_id) VALUES (?, ?, ?, ?, ?)',
            [dadosValidados.nome, dadosValidados.preco, dadosValidados.genero, dadosValidados.paginas, dadosValidados.autor_id]
        );

        res.status(201).json({ id: result.lastID, ...dadosValidados });
    } catch (erro) {
        if (erro instanceof z.ZodError) return res.status(400).json({ erro: 'Validação falhou', detalhes: erro.errors });
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
});

/**
 * Rota PUT
*/

app.put('/api/livros/:id', verificarToken, async (req, res) => {
    try {
        const dadosValidados = livroSchema.parse(req.body);
        const { id } = req.params;

        const livro = await db.get('SELECT id FROM livros WHERE id = ?', [id]);
        if (!livro) return res.status(404).json({ erro: 'Livro não encontrado' });

        await db.run(
            'UPDATE livros SET nome = ?, preco = ?, genero = ?, paginas = ?, autor_id = ? WHERE id = ?',
            [dadosValidados.nome, dadosValidados.preco, dadosValidados.genero, dadosValidados.paginas, dadosValidados.autor_id, id]
        );

        res.json({ mensagem: 'Livro atualizado com sucesso!' });
    } catch (erro) {
        if (erro instanceof z.ZodError) return res.status(400).json({ erro: 'Validação falhou', detalhes: erro.errors });
        res.status(500).json({ erro: 'Erro interno' });
    }
});

/**
 * Rota DELETE
*/

app.delete('/api/livros/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const result = await db.run('DELETE FROM livros WHERE id = ?', [id]);

    if (result.changes === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
    res.json({ mensagem: 'Livro removido com sucesso!' });
});

const PORT = 3000;
app.listen(PORT, async () => {
    await configurarBanco();
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});