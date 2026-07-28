# Laje Signature Web

Alicerce de componentes UI do **Laje Signature** — base Vite + React + TypeScript + MUI para o app do restaurante Laje.

Baseado no kit Minimals (Vite TS), customizado como design system e shell do produto.

## Stack

- Vite + React + TypeScript
- MUI / Emotion
- React Router
- i18n, auth adapters, layouts e biblioteca de componentes em `src/components`

## Pré-requisitos

- Node.js 20.x

## Instalação

```sh
yarn install
yarn dev
```

Ou com npm:

```sh
npm i
npm run dev
```

## Build

```sh
yarn build
```

## Estrutura relevante

```
src/
├── components/   # biblioteca de componentes (alicerce)
├── theme/        # tema MUI
├── layouts/      # shells de layout
├── routes/       # rotas
├── sections/     # views / demos
└── locales/      # i18n
```

## Relacionados

- API: [laje-signature-api](https://github.com/fmaymone/laje-signature-api)
- Biblioteca / motor: [laje-signature](https://github.com/fmaymone/laje-signature)

## Vercel

Deploy contínuo a partir de `main` no GitHub.

```sh
# CLI (primeira vez)
npx vercel link
npx vercel --prod
```

Config em `vercel.json` (Vite → `dist`, SPA rewrites).  
Variáveis públicas: copie de `.env.example` para o painel Vercel (`VITE_*`).  
API de produção: `VITE_SERVER_URL=https://laje-signature-api.onrender.com`
