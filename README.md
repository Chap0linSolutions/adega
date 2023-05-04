# README

Repositório backend do jogo Dom-que-shot

## Setup inicial

Versão do Node.js: 16.13.2

Clonar o repositório e executar:

```
npm i
```

## Rodando localmente

```
npm run dev
```

## Rodando os testes

```
npm run test
```

## Gerando Build

```
npm run build
npm start
```

## Criando Migrations

```
npx knex migrate:make <migration_name>
```

## Executando Migrations
```
npm run knex:migrate
```
Para prod usar: ```$env:NODE_ENV="production"``` antes de executar se o ambiente for windows.

No linux rodar: 
```
NODE_ENV=production npm run knex:migrate
```

## Rollback Migrations
```
npm run knex:migrate:rollback
```
