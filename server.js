const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Listas auxiliares (para o formulário) ----------
app.get('/api/turmas', async (req, res) => {
  const [linhas] = await pool.query('SELECT * FROM turmas ORDER BY nome');
  res.json(linhas);
});

app.get('/api/cursos', async (req, res) => {
  const [linhas] = await pool.query('SELECT * FROM cursos ORDER BY nome');
  res.json(linhas);
});

// ---------- Funções internas ----------
// Junta aluno + turma (N-1) + perfil (1-1) + cursos (N-N) em uma consulta
function sqlListar(where = '') {
  return `
    SELECT a.id, a.nome, a.email, a.turma_id,
           t.nome AS turma,
           p.telefone, p.cidade,
           GROUP_CONCAT(c.id ORDER BY c.nome) AS cursos_ids,
           GROUP_CONCAT(c.nome ORDER BY c.nome SEPARATOR ', ') AS cursos
    FROM alunos a
    LEFT JOIN turmas t     ON t.id = a.turma_id
    LEFT JOIN perfis p     ON p.aluno_id = a.id
    LEFT JOIN matriculas m ON m.aluno_id = a.id
    LEFT JOIN cursos c     ON c.id = m.curso_id
    ${where}
    GROUP BY a.id, a.nome, a.email, a.turma_id, t.nome, p.telefone, p.cidade
    ORDER BY a.nome`;
}

function formatar(aluno) {
  return {
    ...aluno,
    cursos_ids: aluno.cursos_ids ? String(aluno.cursos_ids).split(',').map(Number) : [],
  };
}

// Grava o perfil (1-1) e as matrículas (N-N) usando a conexão da transação
async function salvarRelacionamentos(conn, alunoId, { telefone, cidade, cursos }) {
  await conn.query(
    `INSERT INTO perfis (aluno_id, telefone, cidade) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE telefone = VALUES(telefone), cidade = VALUES(cidade)`,
    [alunoId, telefone || null, cidade || null]
  );

  await conn.query('DELETE FROM matriculas WHERE aluno_id = ?', [alunoId]);
  for (const cursoId of cursos || []) {
    await conn.query('INSERT INTO matriculas (aluno_id, curso_id) VALUES (?, ?)', [alunoId, cursoId]);
  }
}

// Executa uma função dentro de uma transação (commit ou rollback)
async function comTransacao(funcao) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await funcao(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

function validar(body) {
  if (!body.nome || !body.nome.trim()) return 'Informe o nome.';
  if (!body.email || !body.email.trim()) return 'Informe o e-mail.';
  return null;
}

function tratarErro(err, res) {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Já existe um aluno com este e-mail.' });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor. Verifique a conexão com o MySQL.' });
}

// ---------- CRUD de alunos ----------

// READ (todos)
app.get('/api/alunos', async (req, res) => {
  try {
    const [linhas] = await pool.query(sqlListar());
    res.json(linhas.map(formatar));
  } catch (err) {
    tratarErro(err, res);
  }
});

// READ (um)
app.get('/api/alunos/:id', async (req, res) => {
  try {
    const [linhas] = await pool.query(sqlListar('WHERE a.id = ?'), [req.params.id]);
    if (linhas.length === 0) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.json(formatar(linhas[0]));
  } catch (err) {
    tratarErro(err, res);
  }
});

// CREATE
app.post('/api/alunos', async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const id = await comTransacao(async (conn) => {
      const [r] = await conn.query(
        'INSERT INTO alunos (nome, email, turma_id) VALUES (?, ?, ?)',
        [req.body.nome.trim(), req.body.email.trim(), req.body.turma_id || null]
      );
      await salvarRelacionamentos(conn, r.insertId, req.body);
      return r.insertId;
    });
    res.status(201).json({ id });
  } catch (err) {
    tratarErro(err, res);
  }
});

// UPDATE
app.put('/api/alunos/:id', async (req, res) => {
  const erro = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  try {
    const [existe] = await pool.query('SELECT id FROM alunos WHERE id = ?', [req.params.id]);
    if (existe.length === 0) return res.status(404).json({ erro: 'Aluno não encontrado.' });

    await comTransacao(async (conn) => {
      await conn.query(
        'UPDATE alunos SET nome = ?, email = ?, turma_id = ? WHERE id = ?',
        [req.body.nome.trim(), req.body.email.trim(), req.body.turma_id || null, req.params.id]
      );
      await salvarRelacionamentos(conn, req.params.id, req.body);
    });
    res.json({ ok: true });
  } catch (err) {
    tratarErro(err, res);
  }
});

// DELETE (o perfil e as matrículas são removidos em cascata)
app.delete('/api/alunos/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM alunos WHERE id = ?', [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ erro: 'Aluno não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    tratarErro(err, res);
  }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => console.log(`Servidor rodando em http://localhost:${PORTA}`));
