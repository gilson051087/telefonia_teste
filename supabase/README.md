# Supabase

## 1. Criar as tabelas

No SQL Editor do Supabase, execute:

`supabase/schema.sql`

Isso cria:

- `users`
- `vendas`
- `app_sessions`
- admin inicial
- funcoes RPC de autenticacao/usuarios
- RLS nas tabelas sensiveis

Login inicial:

- usuario: `admin`
- senha: `123456`

Troque a senha do admin no primeiro acesso.

### Perfis de acesso

- `superadmin`: cria/remove administradores e pode cadastrar vendedores vinculando cada vendedor a um administrador especifico
- `admin`: cria/remove apenas vendedores da propria loja e gerencia apenas as vendas do proprio time
- `seller`: acessa apenas as proprias vendas

## 2. Variaveis na Vercel

Cadastre:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

Como este projeto usa `react-scripts`, essas sao as variaveis que realmente precisam estar na Vercel para chegar ao frontend.

## 3. Observacao importante

Nesta versao, o app continua no Supabase direto pelo frontend, mas com fluxo seguro:

- login via RPC (`app_login`)
- sessao no banco (`app_sessions`)
- cabecalho `x-app-session` enviado pelo cliente
- acesso a `vendas` protegido por RLS
- tabela `users` sem acesso direto para `anon/authenticated` (somente via RPC)

Nao usa `Supabase Auth` nativo; a autenticacao continua personalizada em `users`, mas com controles de acesso no banco.

## 4. Deploy sem quebra

1. Execute `supabase/schema.sql` no projeto Supabase de producao.
2. Faça novo deploy do frontend.
3. Refaça login (a chave de sessao local mudou para `telefonia_supabase_session_v2`).

Se aplicar o SQL e o novo build juntos, o app segue funcionando sem quebrar as telas.

## 5. Proximo passo recomendado (opcional)

Para nivel enterprise, o passo seguinte e migrar para:

- `Supabase Auth`
- politicas RLS baseadas em `auth.uid()`
- funcoes administrativas com `service_role` no backend
