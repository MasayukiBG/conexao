# Projeto base: CRUD com Node.js + Express + MySQL

## 1. Criar o banco no MySQL Workbench
1. Abra o MySQL Workbench e conecte na sua instância local.
2. File > Open SQL Script e escolha `schema.sql`.
3. Execute o script inteiro (ícone de raio). Rode **uma única vez**,
   pois ele também insere as turmas e cursos de exemplo.
4. Atualize o painel Schemas: o banco `projeto_crud` deve aparecer com 5 tabelas.
   Dica: Database > Reverse Engineer gera o diagrama EER mostrando os relacionamentos.

## 2. Configurar a conexão
Em `db.js`, troque `sua_senha_aqui` pela senha do seu usuário MySQL
(o mesmo da conexão do Workbench). Ou use variáveis de ambiente:
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

## 3. Rodar
```bash
npm install
npm start
```
Abra http://localhost:3000 (requer Node.js 18 ou superior).

## Relacionamentos
| Tipo | Tabelas | Como foi feito |
|------|---------|----------------|
| N-1  | alunos -> turmas | coluna `alunos.turma_id` (FK) |
| 1-1  | alunos -> perfis | `perfis.aluno_id` com FK + UNIQUE |
| N-N  | alunos <-> cursos | tabela associativa `matriculas` (PK composta) |

## Rotas da API
| Método | Rota | Ação |
|--------|------|------|
| GET    | /api/alunos      | lista alunos (com turma, perfil e cursos) |
| GET    | /api/alunos/:id  | busca um aluno |
| POST   | /api/alunos      | cadastra |
| PUT    | /api/alunos/:id  | altera |
| DELETE | /api/alunos/:id  | exclui (perfil e matrículas saem em cascata) |
| GET    | /api/turmas      | lista turmas |
| GET    | /api/cursos      | lista cursos |
