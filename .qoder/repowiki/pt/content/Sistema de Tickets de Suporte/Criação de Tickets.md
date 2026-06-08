# Criação de Tickets

<cite>
**Arquivos Referenciados Neste Documento**
- [tickets.js](file://backend/src/routes/tickets.js)
- [app.js](file://backend/src/app.js)
- [schema.sql](file://database/schema.sql)
- [Tickets.js](file://frontend/src/pages/Tickets.js)
- [api.js](file://frontend/src/services/api.js)
- [package.json](file://backend/package.json)
</cite>

## Sumário
- [Introdução](#introdução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Componentes Principais](#componentes-principais)
- [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
- [Análise Detalhada do Componente](#análise-detalhada-do-componente)
- [Fluxo de Criação de Tickets](#fluxo-de-criação-de-tickets)
- [Validações e Regras de Negócio](#validações-e-regras-de-negócio)
- [Exemplos Práticos](#exemplos-práticos)
- [Tratamento de Erros](#tratamento-de-erros)
- [Considerações de Desempenho](#considerações-de-desempenho)
- [Guia de Solução de Problemas](#guia-de-solução-de-problemas)
- [Conclusão](#conclusão)

## Introdução

O sistema de criação de tickets é um componente fundamental do Apple ID Assistant, responsável por permitir que usuários e técnicos abram chamados de suporte para resolver problemas relacionados a contas Apple ID. Esta funcionalidade implementa um pipeline completo de criação de tickets, incluindo validações rigorosas, geração automática de mensagens iniciais, vinculação com sessões de diagnóstico e armazenamento em mock storage.

O sistema oferece uma experiência robusta tanto para usuários comuns quanto para técnicos, com diferentes níveis de permissões e funcionalidades específicas para cada tipo de usuário.

## Estrutura do Projeto

O projeto segue uma arquitetura de camadas bem definida, com separação clara entre frontend, backend e banco de dados:

```mermaid
graph TB
subgraph "Frontend"
FE1[React Application]
FE2[Tickets Page]
FE3[API Services]
end
subgraph "Backend"
BE1[Express Server]
BE2[Tickets Routes]
BE3[Authentication Middleware]
BE4[Mock Storage]
end
subgraph "Database"
DB1[PostgreSQL Schema]
DB2[Users Table]
DB3[Tickets Table]
DB4[Messages Table]
end
FE1 --> FE2
FE2 --> FE3
FE3 --> BE1
BE1 --> BE2
BE2 --> BE3
BE2 --> BE4
BE4 --> DB1
DB1 --> DB2
DB1 --> DB3
DB1 --> DB4
```

**Fontes da Figura**
- [app.js:110-116](file://backend/src/app.js#L110-L116)
- [tickets.js:10](file://backend/src/routes/tickets.js#L10)
- [schema.sql:53-92](file://database/schema.sql#L53-L92)

**Seção Fontes**
- [app.js:110-116](file://backend/src/app.js#L110-L116)
- [package.json:23-46](file://backend/package.json#L23-L46)

## Componentes Principais

### Backend - Rotas de Tickets

O módulo de tickets implementa um conjunto completo de operações CRUD com validações rigorosas:

- **POST /api/v1/tickets**: Criação de novos tickets
- **GET /api/v1/tickets/my**: Listagem de tickets do usuário logado
- **GET /api/v1/tickets/:ticketId**: Detalhamento de ticket específico
- **POST /api/v1/tickets/:ticketId/messages**: Adição de mensagens ao ticket
- **PATCH /api/v1/tickets/:ticketId/status**: Atualização de status (admin/support)

### Frontend - Interface de Tickets

A interface do usuário oferece uma experiência intuitiva para gerenciamento de tickets:

- Modal de criação de tickets com formulário validado
- Listagem de tickets com status e prioridades visuais
- Detalhamento de tickets com histórico de mensagens
- Integração com serviços de API para operações assíncronas

### Banco de Dados - Esquema de Tickets

O esquema do banco de dados define estruturas robustas para armazenamento de tickets e mensagens:

- Tabela `tickets`: Armazena informações principais do ticket
- Tabela `ticket_messages`: Histórico completo de comunicações
- Constraints de validação para categorias, prioridades e status
- Relacionamentos com tabelas de usuários e sessões

**Seção Fontes**
- [tickets.js:52-101](file://backend/src/routes/tickets.js#L52-L101)
- [Tickets.js:164-266](file://frontend/src/pages/Tickets.js#L164-L266)
- [schema.sql:53-92](file://database/schema.sql#L53-L92)

## Visão Geral da Arquitetura

```mermaid
sequenceDiagram
participant Client as "Cliente Frontend"
participant API as "API Tickets"
participant Auth as "Autenticação JWT"
participant Validator as "Validador Express"
participant Storage as "Mock Storage"
participant Response as "Resposta"
Client->>API : POST /api/v1/tickets
API->>Auth : Verificar Token JWT
Auth-->>API : Token válido
API->>Validator : Validar campos
Validator-->>API : Validação OK
API->>Storage : Criar ticket + mensagem inicial
Storage-->>API : Ticket salvo
API-->>Client : 201 Created + Ticket
Note over Client,Response : Fluxo completo de criação de ticket
```

**Fontes da Sequência**
- [tickets.js:53-101](file://backend/src/routes/tickets.js#L53-L101)
- [tickets.js:15-33](file://backend/src/routes/tickets.js#L15-L33)

## Análise Detalhada do Componente

### Estrutura de Dados do Ticket

Cada ticket é representado por um objeto com as seguintes propriedades:

```mermaid
classDiagram
class Ticket {
+string id
+string subject
+string description
+string category
+string priority
+string status
+string createdBy
+string sessionId
+Date createdAt
+Date updatedAt
+Message[] messages
+string assignedTo
+string resolution
}
class Message {
+string id
+string from
+string author
+string content
+Date timestamp
}
Ticket "1" --> "*" Message : contém
```

**Fontes da Classe**
- [tickets.js:67-87](file://backend/src/routes/tickets.js#L67-L87)

### Status e Prioridades Disponíveis

O sistema define constantes para status e prioridades:

| Status | Descrição | Valor |
|--------|-----------|-------|
| open | Aberto | `open` |
| in_progress | Em Andamento | `in_progress` |
| waiting_user | Aguardando Usuário | `waiting_user` |
| resolved | Resolvido | `resolved` |
| closed | Fechado | `closed` |

| Prioridade | Descrição | Valor |
|------------|-----------|-------|
| low | Baixa | `low` |
| medium | Média | `medium` |
| high | Alta | `high` |
| urgent | Urgente | `urgent` |

**Seção Fontes**
- [tickets.js:36-50](file://backend/src/routes/tickets.js#L36-L50)

## Fluxo de Criação de Tickets

### Etapas do Processo

```mermaid
flowchart TD
Start([Requisição POST /api/v1/tickets]) --> Validate["Validar Campos<br/>- Assunto (5-200 chars)<br/>- Descrição (>=10 chars)<br/>- Categoria válida<br/>- Prioridade opcional<br/>- SessionId opcional"]
Validate --> Valid{"Validação OK?"}
Valid --> |Não| Error400["Retornar 400 Bad Request<br/>com erros de validação"]
Valid --> |Sim| CreateTicket["Criar Objeto Ticket<br/>- Gerar UUID<br/>- Definir status open<br/>- Definir prioridade medium<br/>- Definir createdBy"]
CreateTicket --> CreateMessage["Criar Mensagem Inicial<br/>- Gerar UUID<br/>- from=user<br/>- author=email do usuário<br/>- content=descrição original"]
CreateMessage --> Store["Armazenar no Mock Storage<br/>Map tickets"]
Store --> Response["Retornar 201 Created<br/>- success=true<br/>- ticket com id, subject, status, priority, createdAt"]
Error400 --> End([Fim])
Response --> End
```

**Fontes do Fluxo**
- [tickets.js:53-101](file://backend/src/routes/tickets.js#L53-L101)

### Exemplo de Requisição

**Requisição HTTP:**
```
POST /api/v1/tickets HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "subject": "Problema com recuperação de senha",
  "description": "Estou tendo dificuldades para recuperar minha senha de Apple ID após múltiplas tentativas falhas.",
  "category": "password",
  "priority": "medium",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Resposta HTTP:**
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "subject": "Problema com recuperação de senha",
    "status": "open",
    "priority": "medium",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Seção Fontes**
- [Tickets.js:173-186](file://frontend/src/pages/Tickets.js#L173-L186)
- [api.js:69-75](file://frontend/src/services/api.js#L69-L75)

## Validações e Regras de Negócio

### Validações de Campo

O sistema implementa validações rigorosas usando express-validator:

| Campo | Tipo | Validação | Descrição |
|-------|------|-----------|-----------|
| subject | String | `isLength({ min: 5, max: 200 })` | Assunto obrigatório, 5-200 caracteres |
| description | String | `isLength({ min: 10 })` | Descrição obrigatória, mínimo 10 caracteres |
| category | Enum | `isIn(['password', 'icloud', 'device', 'account', 'other'])` | Categoria válida |
| priority | Enum | `isIn(['low', 'medium', 'high', 'urgent'])` | Prioridade opcional |
| sessionId | UUID | `isUUID()` | ID de sessão opcional |

### Regras de Negócio

1. **Prioridade Padrão**: Se nenhuma prioridade for especificada, assume-se `medium`
2. **Status Inicial**: Todos os tickets são criados com status `open`
3. **Criação Automática**: Uma mensagem inicial é criada automaticamente com o conteúdo da descrição
4. **Vinculação Opcional**: O campo `sessionId` pode ser omitido
5. **Permissões**: Apenas usuários autenticados podem criar tickets

### Categorias de Problemas

As categorias disponíveis são:

| Categoria | Descrição | Código |
|-----------|-----------|--------|
| password | Recuperação de Senha | `password` |
| icloud | Problemas iCloud | `icloud` |
| device | Dispositivo Bloqueado | `device` |
| account | Conta Apple ID | `account` |
| other | Outro | `other` |

**Seção Fontes**
- [tickets.js:54-58](file://backend/src/routes/tickets.js#L54-L58)
- [schema.sql:60-66](file://database/schema.sql#L60-L66)

## Exemplos Práticos

### Template de Criação de Ticket

```javascript
// Frontend - Componente NewTicketModal
const ticketTemplate = {
  subject: '',           // Texto curto, obrigatório
  description: '',       // Descrição detalhada, obrigatório
  category: 'password',  // Categoria válida
  priority: 'medium',    // Prioridade padrão
  sessionId: null        // Opcional
};
```

### Requisições POST Comuns

**Exemplo 1 - Ticket Básico:**
```json
{
  "subject": "Problema de acesso ao iCloud",
  "description": "Não consigo acessar meus arquivos no iCloud após atualização do iOS.",
  "category": "icloud"
}
```

**Exemplo 2 - Ticket Urgente:**
```json
{
  "subject": "Dispositivo bloqueado",
  "description": "iPhone bloqueado com código de 6 dígitos e não consigo desbloquear.",
  "category": "device",
  "priority": "urgent"
}
```

**Exemplo 3 - Ticket com Sessão:**
```json
{
  "subject": "Recuperação de senha",
  "description": "Preciso de ajuda para recuperar minha senha de Apple ID.",
  "category": "password",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Seção Fontes**
- [Tickets.js:164-266](file://frontend/src/pages/Tickets.js#L164-L266)

## Tratamento de Erros

### Códigos de Status HTTP

| Código | Descrição | Causa |
|--------|-----------|-------|
| 201 | Created | Ticket criado com sucesso |
| 400 | Bad Request | Erros de validação nos campos |
| 401 | Unauthorized | Token de autenticação inválido |
| 403 | Forbidden | Acesso negado (permissões insuficientes) |
| 404 | Not Found | Ticket não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

### Exemplos de Erros de Validação

**Erro de Campo Obrigatório:**
```json
{
  "errors": [
    {
      "value": "",
      "msg": "Invalid value",
      "param": "subject",
      "location": "body"
    }
  ]
}
```

**Erro de Categoria Inválida:**
```json
{
  "errors": [
    {
      "value": "invalid_category",
      "msg": "Invalid value",
      "param": "category",
      "location": "body"
    }
  ]
}
```

**Seção Fontes**
- [tickets.js:60-63](file://backend/src/routes/tickets.js#L60-L63)
- [tickets.js:137-139](file://backend/src/routes/tickets.js#L137-L139)

## Considerações de Desempenho

### Mock Storage vs Banco de Dados

O sistema atualmente utiliza um Map como mock storage para desenvolvimento e testes:

- **Vantagens**: Rápido acesso, fácil implementação
- **Desvantagens**: Não persistente, não escalável
- **Alternativas**: Substituir por PostgreSQL com conexão Sequelize

### Melhorias Potenciais

1. **Indexação**: Adicionar índices para campos frequentemente consultados
2. **Paginação**: Implementar paginação para listagens grandes
3. **Cache**: Adicionar camada de cache para tickets recentes
4. **Bulk Operations**: Suportar operações em massa para relatórios

## Guia de Solução de Problemas

### Problemas Comuns

**1. Erro 401 - Token Inválido**
- Verifique se o token JWT está sendo enviado corretamente
- Confirme que o token não expirou
- Verifique a chave JWT_SECRET no ambiente

**2. Erro 400 - Validação Falhou**
- Verifique o tamanho mínimo dos campos
- Confirme que a categoria está entre as opções válidas
- Verifique se o sessionId é um UUID válido

**3. Erro 403 - Acesso Negado**
- Confirme que o usuário tem permissão adequada
- Verifique se o ticket pertence ao usuário logado

### Diagnóstico de Erros

```mermaid
flowchart TD
Error[Erro Recebido] --> Check401{"Código 401?"}
Check401 --> |Sim| AuthIssue["Verificar Token JWT"]
Check401 --> |Não| Check400{"Código 400?"}
Check400 --> |Sim| ValidationIssue["Verificar Validações"]
Check400 --> |Não| Check403{"Código 403?"}
Check403 --> |Sim| PermissionIssue["Verificar Permissões"]
Check403 --> |Não| Check500{"Código 500?"}
Check500 --> |Sim| ServerIssue["Verificar Logs do Servidor"]
Check500 --> |Não| OtherIssue["Outro Erro"]
```

**Seção Fontes**
- [tickets.js:19-32](file://backend/src/routes/tickets.js#L19-L32)
- [app.js:148-162](file://backend/src/app.js#L148-L162)

## Conclusão

O sistema de criação de tickets do Apple ID Assistant oferece uma implementação robusta e bem estruturada para gerenciamento de chamados de suporte. As validações rigorosas garantem integridade dos dados, enquanto a arquitetura modular permite fácil manutenção e expansão.

As principais características incluem:
- Validações completas de campos obrigatórios
- Prioridades configuráveis com valores padrão
- Vinculação opcional com sessões de diagnóstico
- Criação automática de mensagens iniciais
- Armazenamento em mock storage para desenvolvimento
- Tratamento completo de erros e permissões

Para produção, recomenda-se substituir o mock storage pelo banco de dados PostgreSQL e implementar melhorias de desempenho conforme as considerações mencionadas.