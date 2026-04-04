# vida-software — MMVP

## Objetivo imediato

Ter uma página funcionando onde Nicolas e André conseguem registrar dados
e visualizar na tela. Simples, sem perfumaria.

## Stack

- Frontend: React + Vite (pasta /frontend)
- Banco: Supabase (credenciais vêm do André)
- Sem backend por enquanto — React fala direto com Supabase

## Sem backend por enquanto?

Sim. Para o MMVP o React vai se conectar diretamente ao Supabase,
sem precisar do FastAPI. Isso elimina metade da complexidade agora.
O backend entra depois, quando o MMVP já estiver rodando.

## O que o MMVP precisa ter

1. Login com email e senha (Supabase Auth)
2. Formulário para registrar um exercício (tipo, duração, data)
3. Lista mostrando os registros salvos na tela

Só isso. Alimentação e finanças entram na próxima iteração.

## Estrutura de pastas

frontend/src/
├── pages/
│   ├── Login.jsx
│   └── Exercicios.jsx
├── services/
│   └── supabase.js   ← conexão com o banco
└── App.jsx

## Variáveis de ambiente

Arquivo .env na pasta frontend:
VITE_SUPABASE_URL=colar_aqui
VITE_SUPABASE_ANON_KEY=colar_aqui

## Status

- [X] React criado e rodando
- [ ] .env criado com credenciais do Supabase
- [ ] Login funcionando
- [ ] Formulário de exercício salvando no banco
- [ ] Lista de exercícios aparecendo na tela
- [ ] Deploy no Vercel

## Próximas iterações (não agora)

- Alimentação e finanças
- Dashboard com gráficos
- Painel comparativo Nicolas vs André
- Backend FastAPI
