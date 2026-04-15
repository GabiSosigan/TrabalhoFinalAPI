# API de Livraria

Aluna: Gabriela Sosigan Pavaneli Silva
Este projeto é uma API para gerenciar uma livraria, permitindo o cadastro de livros e autores, além de um sistema de login para segurança.

## Como instalar e rodar o projeto

Siga os passos abaixo para configurar o projeto na sua máquina:

1. **Clonar o repositório**
   Abra o terminal e baixe o código do GitHub:
   git clone https://github.com/GabiSosigan/TrabalhoFinalAPI.git

2. **Entrar na pasta**
   cd TrabalhoFinalAPI

3. **Instalar as dependências**
   Este comando baixa todas as bibliotecas listadas no arquivo package.json (como Express e SQLite):
   npm install

4. **Iniciar o servidor**
   Este comando liga a API e cria automaticamente o arquivo do banco de dados:
   npm start

5. **Acessar a API**
   O servidor estará rodando em: http://localhost:3000

## Endpoints da API

### Livros
* GET /api/livros: Lista todos os livros (aceita filtros de gênero e paginação).
* GET /api/livros/:id: Busca um livro específico pelo número do ID.
* POST /api/livros: Cadastra um novo livro (precisa de token).
* PUT /api/livros/:id: Altera os dados de um livro (precisa de token).
* DELETE /api/livros/:id: Remove um livro (precisa de token).

### Autores
* GET /api/autores: Lista todos os autores cadastrados.
* POST /api/autores: Cadastra um novo autor (precisa de token).

### Login
* POST /api/login: Envie o usuário e senha para receber o token de acesso.
* Usuário padrão: admin
* Senha padrão: senha123

## Tecnologias utilizadas

* Node.js: Ambiente de execução.
* Express: Framework para as rotas da API.
* SQLite: Banco de dados local em arquivo.
* JWT: Sistema de tokens para rotas protegidas.
* Zod: Validação dos dados enviados.
* Bcryptjs: Para esconder as senhas no banco de dados.

## Deploy

O projeto está configurado para rodar na plataforma Render, utilizando caminhos absolutos para o banco de dados e variáveis de ambiente para a porta do servidor.