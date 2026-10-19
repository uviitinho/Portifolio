require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.set('trust proxy', 1); // necessário atrás de Render/Railway/Vercel
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Origem não permitida'));
    },
    methods: ['POST', 'GET'],
  })
);

// Máx. 5 mensagens por IP a cada 15 minutos (anti-spam)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { nome, email, telefone, assunto, mensagem, website } = req.body || {};

  // Honeypot: campo invisível que só bots preenchem
  if (website) return res.json({ ok: true });

  const erros = [];
  if (!nome || nome.trim().length < 2 || nome.length > 100) erros.push('Nome inválido.');
  if (!email || !isEmail(email) || email.length > 150) erros.push('E-mail inválido.');
  if (!assunto || assunto.trim().length < 2 || assunto.length > 150) erros.push('Assunto inválido.');
  if (!mensagem || mensagem.trim().length < 10 || mensagem.length > 3000)
    erros.push('A mensagem deve ter entre 10 e 3000 caracteres.');
  if (erros.length) return res.status(400).json({ ok: false, error: erros.join(' ') });

  try {
    await transporter.sendMail({
      from: `"Portfólio" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      replyTo: `"${nome.replace(/["\r\n]/g, '')}" <${email}>`, // responder vai direto pro visitante
      subject: `[Portfólio] ${assunto.replace(/[\r\n]/g, ' ')}`,
      text: `Nome: ${nome}\nE-mail: ${email}\nTelefone: ${telefone || '-'}\n\n${mensagem}`,
      html: `
        <h2>Nova mensagem do portfólio</h2>
        <p><b>Nome:</b> ${escapeHtml(nome)}</p>
        <p><b>E-mail:</b> ${escapeHtml(email)}</p>
        <p><b>Telefone:</b> ${escapeHtml(telefone || '-')}</p>
        <p><b>Assunto:</b> ${escapeHtml(assunto)}</p>
        <hr>
        <p>${escapeHtml(mensagem).replace(/\n/g, '<br>')}</p>`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err.message);
    res.status(500).json({ ok: false, error: 'Não foi possível enviar agora. Tente o WhatsApp.' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(403).json({ ok: false, error: 'Requisição bloqueada.' });
});

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
