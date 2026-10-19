# Backend do portfólio

1. `cd backend && npm install`
2. `cp .env.example .env` e preencha (senha de app do Gmail)
3. `npm run dev` -> http://localhost:3000
4. Abra o `index.html` com Live Server (porta 5500) e teste o formulário.

## Deploy (Render, gratuito)
- New > Web Service > conecte o repositório, Root Directory: `backend`
- Build: `npm install` | Start: `npm start`
- Em Environment, cadastre as mesmas variáveis do `.env`
- Copie a URL gerada (https://xxxx.onrender.com) para o `config.js` da raiz (`window.API_URL`)
