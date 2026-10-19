const menuIcon = document.querySelector('#menu-icon');
const navbar = document.querySelector('.navbar');
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('header nav a');

// Destaca o link do menu da seção visível
window.onscroll = () => {
  sections.forEach((sec) => {
    const top = window.scrollY;
    const offset = sec.offsetTop - 150;
    const height = sec.offsetHeight;
    const id = sec.getAttribute('id');

    if (top >= offset && top < offset + height) {
      navLinks.forEach((link) => link.classList.remove('active'));
      const ativo = document.querySelector('header nav a[href="#' + id + '"]');
      if (ativo) ativo.classList.add('active');
    }
  });
};

menuIcon.onclick = () => {
  menuIcon.classList.toggle('bx-x');
  navbar.classList.toggle('active');
};

// ---------- Projetos (vêm do projects.json) ----------
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  Object.assign(node, props);
  children.forEach((c) => node.append(c));
  return node;
};

async function carregarProjetos() {
  const box = document.querySelector('#projetos-box');
  try {
    const res = await fetch('projects.json');
    const projetos = (await res.json()).filter((p) => p.visivel);

    projetos.forEach((p) => {
      const card = el('div', { className: 'projetos-card' });
      if (p.imagem) card.append(el('img', { src: p.imagem, alt: p.titulo }));
      card.append(el('h3', { textContent: p.titulo }));
      card.append(el('p', { textContent: p.descricao }));

      if (p.tags && p.tags.length) {
        const tags = el('div', { className: 'tags' });
        p.tags.forEach((t) => tags.append(el('span', { className: 'tag', textContent: t })));
        card.append(tags);
      }

      card.append(
        p.link
          ? el('a', { href: p.link, className: 'btn', target: '_blank', rel: 'noopener', textContent: 'Observe' })
          : el('a', { className: 'btn', textContent: 'Em atualização' })
      );
      box.append(card);
    });
  } catch (e) {
    box.textContent = 'Não foi possível carregar os projetos.';
  }
}
carregarProjetos();

// ---------- Formulário de contato ----------
const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const submitBtn = document.querySelector('#submit-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form).entries());

  submitBtn.disabled = true;
  status.className = 'form-status';
  status.textContent = 'Enviando...';

  try {
    const res = await fetch(window.API_URL + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'Erro ao enviar.');

    status.classList.add('ok');
    status.textContent = 'Mensagem enviada! Responderei em breve.';
    form.reset();
  } catch (err) {
    status.classList.add('erro');
    status.textContent = err.message === 'Failed to fetch' ? 'Servidor indisponível. Tente o WhatsApp.' : err.message;
  } finally {
    submitBtn.disabled = false;
  }
});
