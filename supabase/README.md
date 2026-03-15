# Supabase

## 1. Criar as tabelas

No SQL Editor do Supabase, execute:

`supabase/schema.sql`

Isso cria:

- `users`
- `vendas`
- admin inicial

Login inicial:

- usuario: `admin`
- senha: `123456`

## 2. Variaveis na Vercel

Cadastre:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 3. Observacao importante

Nesta versao, o app usa o Supabase como banco direto pelo frontend.
Isso remove os erros `404` da Vercel porque o app deixa de depender das rotas `/api/...`.

Para simplificar a migracao, a autenticacao atual continua personalizada e usa a tabela `users`.
Ou seja: ainda nao esta usando `Supabase Auth`.

Se quiser uma versao mais segura depois, o proximo passo e migrar para:

- `Supabase Auth`
- `RLS`
- funcoes/server actions para operacoes administrativas
