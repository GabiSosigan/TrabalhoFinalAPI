const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
app.use(express.json());

let db;

async function configurarBanco() {
    db = await open({
        filename: './banco.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
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

const PORT = 3000;
app.listen(PORT, async () => {
    await configurarBanco();
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});