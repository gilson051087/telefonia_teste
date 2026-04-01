# Telefonia Teste

Painel comercial para operacao de vendas, acompanhamento de pendencias e visualizacao de indicadores.

## Visao geral

- Frontend em React
- Persistencia principal via Supabase
- Backend Node opcional para operacao local com SQLite
- Deploy de referencia com `nginx` + `systemd`

## Estrutura

- `src/`: aplicacao React
- `api/`: backend Node e utilitarios administrativos
- `deploy/`: configuracoes de deploy para Ubuntu
- `supabase/`: schema e notas de configuracao

## Requisitos

- Node.js 22.x
- npm 10+
- Projeto Supabase configurado para o frontend

## Configuracao local

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Preencha as variaveis:

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

## Scripts

- `npm start`: inicia o frontend em desenvolvimento
- `npm run build`: gera o build de producao
- `npm test -- --watchAll=false`: executa os testes
- `npm run backend`: inicia o backend local com SQLite
- `npm run reset-admin`: recria ou redefine o usuario administrador local

## Fluxo de desenvolvimento

1. Suba o frontend com `npm start`
2. Se precisar do backend local, rode `npm run backend`
3. Valide alteracoes com `npm test -- --watchAll=false`
4. Gere o build com `npm run build`

## Deploy

O guia de referencia para Ubuntu esta em [deploy/README-ubuntu.md](/Users/gilson/Documents/sistema%20de%20vendas/telefonia_teste/deploy/README-ubuntu.md).

O serviço `systemd` le variaveis sensiveis de `/etc/telefonia-teste/backend.env`, evitando segredos inline no arquivo da unidade.

## Seguranca e configuracao

- Nao versione o arquivo `.env`
- Troque a senha padrao do administrador imediatamente em ambientes reais
- Defina um `JWT_SECRET` longo e aleatorio no ambiente do backend
- Restrinja acesso ao banco e aos logs de producao

## Estado atual do projeto

Este repositorio pode conter ajustes locais nao commitados durante desenvolvimento. Antes de publicar, revise:

- arquivos de ambiente
- credenciais e chaves
- textos padrao
- configuracoes de deploy
