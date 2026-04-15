const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const {open} = require('sqlite');
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

    console.log('Banco de dados configurado');
}

const PORT = 3000;
app.listen(PORT, async () => {
    await configurarBanco();
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});