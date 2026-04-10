# Sala Rosa – Frontend

Interface do sistema Sala Rosa para gerenciamento de agendamentos, agenda e operações do usuário.

Aplicação focada em consumo de API REST e controle de estado no cliente.

---

## Stack

- Next.js
- React
- JavaScript
- CSS / Tailwind (se estiver usando)

---

## Estrutura
- app/ → páginas (App Router)
- components/ → componentes reutilizáveis
- context/ → contexto global (ex: usuário)
- hooks/ → hooks customizados
- lib/ → integrações (api client, configs)
- utils/ → funções auxiliares
- styles/ → estilos globais
- public/ → assets


---

## Funcionamento

- Consome API backend (Sala Rosa)
- Controle de autenticação via token
- Renderização baseada em estado do usuário
- Integração com endpoints de:
  - agendamento
  - agenda
  - financeiro
  - vendas

---

## Autenticação

- Token JWT armazenado no cliente
- Enviado via:
  - Authorization Bearer

---

## Execução

```bash
npm install
npm run dev
