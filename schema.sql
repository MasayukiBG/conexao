-- Abra este arquivo no MySQL Workbench (File > Open SQL Script)
-- e execute tudo (raio) UMA vez.

CREATE DATABASE IF NOT EXISTS projeto_crud
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE projeto_crud;

-- Turmas (lado "1" da relação N-1 com alunos)
CREATE TABLE IF NOT EXISTS turmas (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ano  INT
) ENGINE=InnoDB;

-- Cursos (um dos lados da relação N-N com alunos)
CREATE TABLE IF NOT EXISTS cursos (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- Alunos
-- N-1: vários alunos pertencem a UMA turma (turma_id)
CREATE TABLE IF NOT EXISTS alunos (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nome     VARCHAR(150) NOT NULL,
  email    VARCHAR(150) NOT NULL UNIQUE,
  turma_id INT NULL,
  CONSTRAINT fk_alunos_turma
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 1-1: cada aluno tem no máximo UM perfil (aluno_id é UNIQUE)
CREATE TABLE IF NOT EXISTS perfis (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL UNIQUE,
  telefone VARCHAR(30),
  cidade   VARCHAR(100),
  CONSTRAINT fk_perfis_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- N-N: um aluno cursa vários cursos e um curso tem vários alunos
-- (tabela associativa com chave primária composta)
CREATE TABLE IF NOT EXISTS matriculas (
  aluno_id INT NOT NULL,
  curso_id INT NOT NULL,
  PRIMARY KEY (aluno_id, curso_id),
  CONSTRAINT fk_matriculas_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
  CONSTRAINT fk_matriculas_curso
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dados iniciais para o select de turmas e os checkboxes de cursos
INSERT INTO turmas (nome, ano) VALUES ('Turma A', 2026), ('Turma B', 2026), ('Turma C', 2026);
INSERT INTO cursos (nome) VALUES
  ('Programação Backend'), ('Banco de Dados'), ('Redes'), ('Sistemas Operacionais');
