// Frontend: fala com a API do servidor via fetch
const form = document.getElementById('form');
const campos = {
  id: document.getElementById('id'),
  nome: document.getElementById('nome'),
  email: document.getElementById('email'),
  telefone: document.getElementById('telefone'),
  cidade: document.getElementById('cidade'),
  turma: document.getElementById('turma'),
};
const divCursos = document.getElementById('cursos');
const lista = document.getElementById('lista');
const mensagem = document.getElementById('mensagem');
const btnSalvar = document.getElementById('salvar');
const btnCancelar = document.getElementById('cancelar');

async function api(url, opcoes = {}) {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });
  const dados = await resp.json();
  if (!resp.ok) throw new Error(dados.erro || 'Erro na requisição.');
  return dados;
}

function aviso(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? 'erro' : '';
}

// Escapa texto antes de colocar no HTML
function esc(texto) {
  const d = document.createElement('div');
  d.textContent = texto ?? '';
  return d.innerHTML;
}

async function carregarOpcoes() {
  const [turmas, cursos] = await Promise.all([api('/api/turmas'), api('/api/cursos')]);

  campos.turma.innerHTML =
    '<option value="">Sem turma</option>' +
    turmas.map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join('');

  divCursos.innerHTML = cursos
    .map((c) => `<label><input type="checkbox" name="curso" value="${c.id}"> ${esc(c.nome)}</label>`)
    .join('');
}

async function carregarAlunos() {
  const alunos = await api('/api/alunos');
  if (alunos.length === 0) {
    lista.innerHTML = '<tr><td colspan="7">Nenhum aluno cadastrado. Preencha o formulário acima.</td></tr>';
    return;
  }
  lista.innerHTML = alunos
    .map(
      (a) => `
      <tr>
        <td>${esc(a.nome)}</td>
        <td>${esc(a.email)}</td>
        <td>${esc(a.telefone)}</td>
        <td>${esc(a.cidade)}</td>
        <td>${esc(a.turma)}</td>
        <td>${esc(a.cursos)}</td>
        <td class="acoes-cel">
          <button type="button" class="secundario" data-editar="${a.id}">Editar</button>
          <button type="button" class="perigo" data-excluir="${a.id}">Excluir</button>
        </td>
      </tr>`
    )
    .join('');
}

function limparFormulario() {
  form.reset();
  campos.id.value = '';
  btnSalvar.textContent = 'Cadastrar aluno';
  btnCancelar.hidden = true;
}

function cursosSelecionados() {
  return [...document.querySelectorAll('input[name="curso"]:checked')].map((c) => Number(c.value));
}

// CREATE / UPDATE
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = {
    nome: campos.nome.value,
    email: campos.email.value,
    telefone: campos.telefone.value,
    cidade: campos.cidade.value,
    turma_id: campos.turma.value ? Number(campos.turma.value) : null,
    cursos: cursosSelecionados(),
  };
  const editando = Boolean(campos.id.value);

  try {
    await api(editando ? `/api/alunos/${campos.id.value}` : '/api/alunos', {
      method: editando ? 'PUT' : 'POST',
      body: JSON.stringify(dados),
    });
    aviso(editando ? 'Aluno atualizado.' : 'Aluno cadastrado.');
    limparFormulario();
    carregarAlunos();
  } catch (err) {
    aviso(err.message, true);
  }
});

btnCancelar.addEventListener('click', () => {
  limparFormulario();
  aviso('');
});

// Botões de Editar / Excluir (delegação de eventos na tabela)
lista.addEventListener('click', async (e) => {
  const idEditar = e.target.dataset.editar;
  const idExcluir = e.target.dataset.excluir;

  try {
    if (idEditar) {
      const a = await api(`/api/alunos/${idEditar}`);
      campos.id.value = a.id;
      campos.nome.value = a.nome;
      campos.email.value = a.email;
      campos.telefone.value = a.telefone || '';
      campos.cidade.value = a.cidade || '';
      campos.turma.value = a.turma_id || '';
      document.querySelectorAll('input[name="curso"]').forEach((c) => {
        c.checked = a.cursos_ids.includes(Number(c.value));
      });
      btnSalvar.textContent = 'Salvar alterações';
      btnCancelar.hidden = false;
      aviso('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (idExcluir && confirm('Excluir este aluno?')) {
      await api(`/api/alunos/${idExcluir}`, { method: 'DELETE' });
      aviso('Aluno excluído.');
      carregarAlunos();
    }
  } catch (err) {
    aviso(err.message, true);
  }
});

carregarOpcoes().then(carregarAlunos).catch((err) => aviso(err.message, true));
