document.documentElement.classList.add('js');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const fromRoot = (p) => (p ? p.replace(/^\.?\//, '') : '');
const safeUrl = (u) => {
  try { const url = new URL(u, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
};

/* ---------- Navegação ---------- */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navLinks = $$('.links a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.hash === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach((s) => spy.observe(s));

/* ---------- Revelação e contadores ---------- */
const countUp = (node) => {
  const end = +node.dataset.count;
  if (reduceMotion) { node.textContent = end; return; }
  const t0 = performance.now(), dur = 1600;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    node.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const revealer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(countUp);
    revealer.unobserve(e.target);
  });
}, { threshold: 0.15 });
$$('.reveal').forEach((n, i) => {
  n.style.transitionDelay = (n.closest('.hero') ? 0.35 + (i % 6) * 0.08 : 0) + 's';
  revealer.observe(n);
});

/* ---------- Pipeline bronze → silver → gold ---------- */
(() => {
  const cv = $('#flow'), cx = cv.getContext('2d'), hero = $('.hero'), stats = $('.hero-stats');
  const GATES = [0.5, 0.7, 0.88], NAMES = ['bronze', 'silver', 'gold'], COLORS = ['#c0703c', '#d9d2cc', '#ffb27a'];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W, H, base, LANES, P = [], mx = -999, my = -999, t = 0, visible = true;

  const size = () => {
    W = hero.clientWidth; H = hero.clientHeight;
    base = H - stats.offsetHeight - 40;
    LANES = Math.max(6, Math.round((base - 120) / 34));
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const laneY = (i) => 110 + i * (base - 140) / (LANES - 1);
  const spawn = (x) => ({ x: x ?? -10, y: 100 + Math.random() * (base - 120), v: (0.45 + Math.random() * 0.85) * Math.max(0.7, W / 1300), s: 1.6 + Math.random() * 2.6, j: Math.random() * 6.28 });
  const target = () => Math.min(380, W / 3.6);

  const frame = () => {
    t++;
    cx.clearRect(0, 0, W, H);
    GATES.forEach((g, i) => {
      const x = g * W;
      const glow = cx.createLinearGradient(x - 40, 0, x + 40, 0);
      glow.addColorStop(0, 'rgba(255,120,40,0)');
      glow.addColorStop(0.5, `rgba(255,120,40,${0.06 + i * 0.05})`);
      glow.addColorStop(1, 'rgba(255,120,40,0)');
      cx.fillStyle = glow;
      cx.fillRect(x - 40, 80, 80, base - 80);
      const line = cx.createLinearGradient(0, 80, 0, base);
      line.addColorStop(0, 'rgba(255,178,122,0)');
      line.addColorStop(0.3, 'rgba(255,178,122,.5)');
      line.addColorStop(1, 'rgba(255,178,122,.15)');
      cx.fillStyle = line;
      cx.fillRect(x, 80, 1, base - 80);
      cx.font = '500 12px "JetBrains Mono", monospace';
      cx.textAlign = 'center';
      cx.fillStyle = COLORS[i];
      cx.fillText(NAMES[i], x, base + 22);
    });

    while (P.length < target()) P.push(spawn());
    P = P.filter((p) => p.x < W + 12);
    const gap = (base - 140) / (LANES - 1);
    for (const p of P) {
      const f = p.x / W;
      const stage = f < GATES[0] ? 0 : f < GATES[1] ? 1 : f < GATES[2] ? 2 : 3;
      p.x += p.v * (stage === 3 ? 1.7 : 1);
      if (stage === 0) p.y += Math.sin(t * 0.025 + p.j) * 0.6;
      else {
        const ty = laneY(Math.max(0, Math.min(LANES - 1, Math.round((p.y - 110) / gap))));
        p.y += (ty - p.y) * [0, 0.03, 0.08, 0.22][stage];
      }
      const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
      if (d < 110 && d > 0) { const k = (110 - d) * 0.05; p.x += dx / d * k; p.y += dy / d * k; }
      const k = Math.min(1, p.x / (W * GATES[2]));
      cx.fillStyle = `hsla(${18 + k * 10},${30 + k * 70}%,${38 + k * 26}%,${0.25 + k * 0.75})`;
      if (stage >= 2) { cx.shadowColor = 'rgba(255,140,60,.8)'; cx.shadowBlur = 6; }
      cx.fillRect(p.x, p.y, p.s * (stage > 1 ? 1.6 : 1), p.s * (stage > 1 ? 0.55 : 1));
      cx.shadowBlur = 0;
    }
    if (!reduceMotion && visible) requestAnimationFrame(frame);
  };

  size();
  for (let i = 0; i < target(); i++) P.push(spawn(Math.random() * W));
  frame();
  addEventListener('resize', () => { size(); if (reduceMotion) frame(); });
  hero.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mx = my = -999; });
  // Pausa a animação quando o hero sai da tela
  new IntersectionObserver(([e]) => {
    const was = visible; visible = e.isIntersecting;
    if (visible && !was && !reduceMotion) requestAnimationFrame(frame);
  }).observe(hero);
})();

/* ---------- Método: camada ativa conforme a rolagem ---------- */
(() => {
  const section = $('#metodo'), bar = $('#method-bar'), layers = $$('.layer');
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = section.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    bar.style.setProperty('--p', p.toFixed(3));
    const mid = innerHeight / 2;
    let best = layers[0], bestD = Infinity;
    layers.forEach((l) => { const b = l.getBoundingClientRect(); const d = Math.abs(b.top + b.height / 2 - mid); if (d < bestD) { bestD = d; best = l; } });
    layers.forEach((l) => l.classList.toggle('active', l === best));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ---------- Projetos ---------- */
const projects = [];
(async () => {
  const list = $('#work-list'), preview = $('#cursor-preview'), pimg = $('img', preview);
  try {
    const res = await fetch('projects.json');
    const data = (await res.json()).filter((p) => p.visivel);
    data.forEach((p, i) => {
      projects.push(p);
      const li = el('li', 'work-item');
      li.id = 'projeto-' + (i + 1);
      const row = el('button', 'work-row');
      row.type = 'button';
      row.setAttribute('aria-expanded', 'false');
      const tags = el('span', 'work-tags');
      (p.tags || []).slice(0, 3).forEach((tg) => tags.append(el('span', '', tg)));
      row.append(el('span', 'work-num', String(i + 1).padStart(2, '0')), el('span', 'work-title', p.titulo), tags, el('span', 'work-icon'));

      const body = el('div', 'work-body'), wrap = el('div'), inner = el('div', 'work-inner'), text = el('div');
      text.append(el('p', '', p.descricao));
      const link = safeUrl(p.link);
      if (link) { const a = el('a', '', 'Ver projeto ↗'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; text.append(a); }
      else text.append(el('span', 'corp', 'Projeto corporativo'));
      inner.append(text);
      if (p.imagem) { const img = el('img'); img.src = fromRoot(p.imagem); img.alt = p.titulo; img.loading = 'lazy'; inner.append(img); }
      wrap.append(inner); body.append(wrap); li.append(row, body); list.append(li);

      row.addEventListener('click', () => {
        const open = !li.classList.contains('open');
        $$('.work-item', list).forEach((x) => { x.classList.remove('open'); $('.work-row', x).setAttribute('aria-expanded', 'false'); });
        li.classList.toggle('open', open);
        row.setAttribute('aria-expanded', String(open));
        if (open) preview.classList.remove('show');
      });
      if (finePointer && p.imagem) {
        row.addEventListener('pointerenter', () => { if (li.classList.contains('open')) return; pimg.src = fromRoot(p.imagem); preview.classList.add('show'); });
        row.addEventListener('pointerleave', () => preview.classList.remove('show'));
      }
    });
    buildPalette();
  } catch {
    list.append(el('li', 'work-item', 'Não foi possível carregar os projetos.'));
  }

  if (!finePointer) return;
  let x = 0, y = 0, tx = 0, ty = 0;
  addEventListener('pointermove', (e) => { tx = e.clientX + 200; ty = e.clientY; }, { passive: true });
  addEventListener('scroll', () => preview.classList.remove('show'), { passive: true });
  const follow = () => {
    x += (tx - x) * 0.15; y += (ty - y) * 0.15;
    preview.style.left = x + 'px'; preview.style.top = y + 'px';
    requestAnimationFrame(follow);
  };
  follow();
})();

/* ---------- Formulário (envia para o e-mail via backend) ---------- */
(() => {
  const form = $('#contact-form'), btn = $('#submit-btn'), log = $('#form-log');
  const line = (cls, text) => { const s = el('span', cls, text + '\n'); log.append(s); };
  const rules = {
    nome: (v) => v.trim().length >= 2 || 'informe seu nome',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'e-mail inválido',
    assunto: (v) => v.trim().length >= 2 || 'informe o assunto',
    mensagem: (v) => v.trim().length >= 10 || 'mensagem precisa de 10+ caracteres',
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    log.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    const errors = [];
    Object.entries(rules).forEach(([k, fn]) => {
      const ok = fn(data[k] || '');
      form.elements[k].closest('.field').classList.toggle('invalid', ok !== true);
      if (ok !== true) errors.push(ok);
    });
    if (errors.length) { errors.forEach((m) => line('err', '✕ ' + m)); return; }

    btn.disabled = true;
    line('run', '› validando campos … ok');
    line('run', '› enviando para o e-mail …');
    try {
      const res = await fetch((window.API_URL || '') + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'Erro ao enviar.');
      line('ok', '✓ mensagem entregue. Respondo em breve.');
      form.reset();
    } catch (err) {
      line('err', '✕ ' + (err.message === 'Failed to fetch' ? 'servidor indisponível. Tente o WhatsApp.' : err.message));
    } finally {
      btn.disabled = false;
    }
  });
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('invalid'));
})();

/* ---------- Paleta de comandos (Ctrl/Cmd + K) ---------- */
const palette = $('#palette'), pInput = $('#palette-input'), pList = $('#palette-list');
let commands = [], filtered = [], sel = 0;
const go = (hash) => () => { $(hash)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); };
const open = (url) => () => window.open(url, '_blank', 'noopener');

function buildPalette() {
  commands = [
    { label: 'Início', hint: 'seção', run: go('#top') },
    { label: 'Método bronze → silver → gold', hint: 'seção', run: go('#metodo') },
    { label: 'Projetos', hint: 'seção', run: go('#projetos') },
    { label: 'Sobre', hint: 'seção', run: go('#sobre') },
    { label: 'Enviar e-mail', hint: 'contato', run: () => { go('#contato')(); setTimeout(() => $('#f-nome').focus({ preventScroll: true }), 600); } },
    ...projects.map((p, i) => ({
      label: p.titulo, hint: 'projeto',
      run: () => { const li = $('#projeto-' + (i + 1)); go('#projeto-' + (i + 1))(); if (!li.classList.contains('open')) $('.work-row', li).click(); },
    })),
    { label: 'Baixar currículo', hint: 'pdf', run: open('imagens/CV_Victor_Franca.pdf') },
    { label: 'WhatsApp', hint: 'link', run: open('https://wa.me/5511994814535') },
    { label: 'LinkedIn', hint: 'link', run: open('https://www.linkedin.com/in/victor-fran%C3%A7a-b80439208') },
    { label: 'GitHub', hint: 'link', run: open('https://github.com/uviitinho') },
  ];
}
buildPalette();

const render = () => {
  const q = pInput.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  filtered = commands.filter((c) => c.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q));
  sel = Math.min(sel, Math.max(0, filtered.length - 1));
  pList.replaceChildren(...filtered.map((c, i) => {
    const li = el('li');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(i === sel));
    li.append(el('span', '', c.label), el('small', '', c.hint));
    li.addEventListener('click', () => runCmd(i));
    li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; render(); } });
    return li;
  }));
  if (!filtered.length) pList.append(el('li', '', 'Nada encontrado'));
};
const runCmd = (i) => { const c = filtered[i]; if (!c) return; palette.close(); c.run(); };
const openPalette = () => { pInput.value = ''; sel = 0; render(); palette.showModal(); pInput.focus(); };

$('#open-palette').addEventListener('click', openPalette);
addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.open ? palette.close() : openPalette(); }
});
pInput.addEventListener('input', () => { sel = 0; render(); });
pInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, filtered.length); render(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); render(); }
  else if (e.key === 'Enter') { e.preventDefault(); runCmd(sel); }
});
palette.addEventListener('click', (e) => { if (e.target === palette) palette.close(); });

/* ---------- Rodapé ---------- */
$('#year').textContent = new Date().getFullYear();
const clock = () => { $('#clock').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }); };
clock();
setInterval(clock, 30000);
