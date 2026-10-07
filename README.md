# Sala Rosa — Frontend

Frontend do sistema **Sala Rosa**, uma aplicação para gerenciamento de agenda, agendamentos, vendas e operações financeiras.

Este repositório representa a camada web do projeto e consome a API disponível no repositório [`Sala-Rosa-back`](https://github.com/ThzEverton/Sala-Rosa-back).

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- React Hook Form
- Zod
- Recharts
- Vercel Analytics

## Funcionalidades

- autenticação e sessão do usuário
- agenda e visualização de horários
- fluxo de agendamentos
- operações de vendas
- indicadores e informações financeiras
- componentes reutilizáveis e responsivos
- consumo da API REST do backend

## Organização

```text
app/          rotas e páginas
components/   componentes reutilizáveis
context/      estado global
hooks/        hooks da aplicação
lib/          integrações e utilitários
styles/       estilos globais
utils/        funções auxiliares
public/       arquivos públicos
```

## Autenticação

As requisições autenticadas utilizam token no padrão `Authorization: Bearer <token>`.

## Executando localmente

```bash
npm install
npm run dev
```

A aplicação utiliza App Router e pode ser acessada em `http://localhost:3000` durante o desenvolvimento.
