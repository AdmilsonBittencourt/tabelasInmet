# 🗄️ Configuração do Banco de Dados PostgreSQL

Este projeto utiliza **TypeORM** e **PostgreSQL** para armazenar os dados meteorológicos da API INMET.

## 📋 Pré-requisitos

- Node.js instalado
- Docker e Docker Compose instalados
- Token da API INMET (configurado no arquivo `.env`)

## 🚀 Configuração Inicial

### 1. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e ajuste as configurações:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=apiinmet
```

### 2. Inicie o PostgreSQL com Docker Compose

```bash
docker-compose up -d
```

Isso irá iniciar um container PostgreSQL na porta 5432.

### 3. Instale as dependências (se ainda não instalou)

```bash
npm install
```

### 4. Inicie o servidor

O TypeORM irá criar automaticamente as tabelas quando o servidor iniciar (em modo desenvolvimento):

```bash
npm run dev
```

## 📊 Estrutura das Tabelas

O banco de dados possui 4 tabelas principais:

1. **`dados_horarios`** - Dados meteorológicos horários
2. **`dados_diarios`** - Dados meteorológicos diários processados
3. **`resumo_mensal`** - Resumos estatísticos mensais
4. **`resumo_anual`** - Resumos estatísticos anuais

## 🔄 Como Popular o Banco de Dados

### Opção 1: Via API REST (Recomendado)

Com o servidor rodando, você pode usar as seguintes rotas:

#### Popular um período específico:
```bash
POST http://localhost:3000/populate/periodo/2024-01-01/2024-01-31
```

#### Popular um mês completo:
```bash
POST http://localhost:3000/populate/mes/2024/1
```

#### Popular um ano completo:
```bash
POST http://localhost:3000/populate/ano/2024
```

#### Especificar código da estação:
```bash
POST http://localhost:3000/populate/periodo/2024-01-01/2024-01-31?stationCode=A025
```

### Opção 2: Via Script de Linha de Comando

#### Popular um período:
```bash
npx ts-node src/scripts/populate.ts periodo 2024-01-01 2024-01-31
```

#### Popular um mês:
```bash
npx ts-node src/scripts/populate.ts mes 2024 1
```

#### Popular um ano:
```bash
npx ts-node src/scripts/populate.ts ano 2024
```

#### Especificar código da estação:
```bash
npx ts-node src/scripts/populate.ts periodo 2024-01-01 2024-01-31 A025
```

## 📝 Exemplos de Uso

### Exemplo 1: Popular dados de janeiro de 2024

```bash
curl -X POST http://localhost:3000/populate/mes/2024/1
```

### Exemplo 2: Popular um período específico

```bash
curl -X POST http://localhost:3000/populate/periodo/2024-01-15/2024-01-20
```

### Exemplo 3: Popular todo o ano de 2024

```bash
curl -X POST http://localhost:3000/populate/ano/2024
```

⚠️ **Nota:** Popular um ano completo pode levar bastante tempo, pois faz requisições para todos os 12 meses.

## 🔍 Consultar Dados no Banco

Você pode usar qualquer cliente PostgreSQL para consultar os dados:

```sql
-- Ver todos os dados diários
SELECT * FROM dados_diarios ORDER BY "DT_MEDICAO" DESC LIMIT 10;

-- Ver resumos mensais
SELECT * FROM resumo_mensal WHERE ano = 2024 ORDER BY mes;

-- Ver resumo anual
SELECT * FROM resumo_anual WHERE ano = 2024;

-- Contar registros
SELECT COUNT(*) FROM dados_horarios;
SELECT COUNT(*) FROM dados_diarios;
```

## 🛠️ Comandos Úteis

### Parar o PostgreSQL
```bash
docker-compose down
```

### Parar e remover volumes (apaga os dados)
```bash
docker-compose down -v
```

### Ver logs do PostgreSQL
```bash
docker-compose logs -f postgres
```

### Conectar ao PostgreSQL via psql
```bash
docker exec -it apiinmet_postgres psql -U postgres -d apiinmet
```

## ⚠️ Observações Importantes

1. **Duplicatas**: O sistema verifica automaticamente se os dados já existem antes de inserir, evitando duplicatas.

2. **Performance**: Ao popular grandes volumes de dados (ex: um ano inteiro), o processo pode levar vários minutos devido às chamadas à API INMET.

3. **Rate Limiting**: O script inclui delays entre requisições para não sobrecarregar a API INMET.

4. **Desenvolvimento vs Produção**: 
   - Em desenvolvimento: `synchronize: true` cria/atualiza tabelas automaticamente
   - Em produção: Use migrations (`synchronize: false`)

## 🐛 Troubleshooting

### Erro de conexão com o banco
- Verifique se o PostgreSQL está rodando: `docker-compose ps`
- Verifique as credenciais no arquivo `.env`
- Verifique se a porta 5432 não está sendo usada por outro serviço

### Tabelas não foram criadas
- Verifique se `NODE_ENV` não está definido como `production` no `.env`
- Reinicie o servidor
- Verifique os logs do servidor para erros

### Erro ao popular dados
- Verifique se o token da API INMET está configurado no `.env`
- Verifique se a data/período são válidos
- Verifique os logs do servidor para mais detalhes

