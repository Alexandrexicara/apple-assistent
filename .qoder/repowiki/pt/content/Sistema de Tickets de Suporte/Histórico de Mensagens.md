# Histórico de Mensagens

<cite>
**Arquivos Referenciados Neste Documento**
- [backend/src/routes/tickets.js](file://backend/src/routes/tickets.js)
- [backend/src/app.js](file://backend/src/app.js)
- [frontend/src/pages/Tickets.js](file://frontend/src/pages/Tickets.js)
- [frontend/src/services/api.js](file://frontend/src/services/api.js)
- [database/schema.sql](file://database/schema.sql)
</cite>

## Sumário
- O sistema de mensagens dentro dos tickets permite que usuários e técnicos mantenham um histórico completo de comunicação
- Diferencia automaticamente entre autores: usuário, suporte e sistema
- Garante atualizações automáticas de status quando usuários respondem a tickets aguardando resposta
- Mantém histórico ordenado cronologicamente com timestamps automáticos
- Integra-se ao fluxo de atendimento e notificações

## Arquitetura Geral do Sistema de Mensagens

O sistema de mensagens é composto por três camadas principais:

```mermaid
graph TB
subgraph "Frontend"
UI[Tela de Tickets]
API[API Client]
end
subgraph "Backend"
Auth[Autenticação JWT]
Tickets[Tickets Router]
Validation[Validações]
end
subgraph "Banco de Dados"
TicketsDB[Tickets Table]
MessagesDB[Ticket Messages Table]
end
UI --> API
API --> Auth
Auth --> Tickets
Tickets --> Validation
Tickets --> TicketsDB
TicketsDB --> MessagesDB
```

**Diagrama Fontes**
- [backend/src/routes/tickets.js:15-331](file://backend/src/routes/tickets.js#L15-L331)
- [database/schema.sql:53-92](file://database/schema.sql#L53-L92)

## Componentes Principais

### 1. Estrutura de Dados do Ticket

Cada ticket contém um array de mensagens que são armazenadas em ordem cronológica:

```mermaid
erDiagram
TICKETS {
uuid id PK
uuid user_id FK
uuid session_id
varchar subject
text description
varchar category
varchar priority
varchar status
uuid assigned_to
text resolution
timestamp created_at
timestamp updated_at
timestamp resolved_at
}
TICKET_MESSAGES {
uuid id PK
uuid ticket_id FK
uuid user_id
varchar from_type
text content
jsonb attachments
boolean is_internal
timestamp created_at
}
TICKETS ||--o{ TICKET_MESSAGES : "contém"
```

**Diagrama Fontes**
- [database/schema.sql:53-92](file://database/schema.sql#L53-L92)

### 2. Tipos de Autores e Diferenciação

O sistema identifica automaticamente o autor de cada mensagem com base no contexto:

| Tipo | Valor Interno | Descrição | Exemplo |
|------|---------------|-----------|---------|
| Usuário | `'user'` | Solicitante do ticket | `req.user.email` |
| Técnico | `'support'` | Atendente da equipe | `req.user.email` |
| Sistema | `'system'` | Mensagens automáticas | `Sistema` |

**Seção Fontes**
- [backend/src/routes/tickets.js:175-181](file://backend/src/routes/tickets.js#L175-L181)
- [database/schema.sql:87](file://database/schema.sql#L87)

### 3. Fluxo de Criação de Mensagem

```mermaid
sequenceDiagram
participant User as "Usuário"
participant Frontend as "Frontend"
participant API as "API Tickets"
participant Auth as "Autenticação"
participant DB as "Banco de Dados"
User->>Frontend : Enviar mensagem
Frontend->>API : POST /tickets/ : ticketId/messages
API->>Auth : Verificar token JWT
Auth-->>API : Dados do usuário
API->>API : Validar permissões
API->>API : Criar mensagem com timestamps
API->>DB : Salvar mensagem
API->>DB : Atualizar status se necessário
DB-->>API : Confirmação
API-->>Frontend : Resposta com mensagem
Frontend-->>User : Exibir mensagem
```

**Diagrama Fontes**
- [backend/src/routes/tickets.js:152-197](file://backend/src/routes/tickets.js#L152-L197)
- [frontend/src/services/api.js:68-75](file://frontend/src/services/api.js#L68-L75)

## Funcionalidades Detalhadas

### 1. Validações de Conteúdo

O sistema aplica validações rigorosas para garantir qualidade das mensagens:

```mermaid
flowchart TD
Start([Recebimento da Requisição]) --> Validate["Validar Parâmetros"]
Validate --> ParamValid{"Parâmetros Válidos?"}
ParamValid --> |Não| ReturnError["Retornar Erro 400"]
ParamValid --> |Sim| CheckTicket["Verificar Ticket"]
CheckTicket --> TicketExists{"Ticket Existe?"}
TicketExists --> |Não| ReturnNotFound["Retornar Erro 404"]
TicketExists --> |Sim| CheckPermission["Verificar Permissões"]
CheckPermission --> HasPermission{"Permissão Válida?"}
HasPermission --> |Não| ReturnForbidden["Retornar Erro 403"]
HasPermission --> |Sim| CreateMessage["Criar Mensagem"]
CreateMessage --> UpdateStatus["Atualizar Status Se Necessário"]
UpdateStatus --> SaveToDB["Salvar no Banco de Dados"]
SaveToDB --> ReturnSuccess["Retornar Sucesso"]
ReturnError --> End([Fim])
ReturnNotFound --> End
ReturnForbidden --> End
ReturnSuccess --> End
```

**Diagrama Fontes**
- [backend/src/routes/tickets.js:152-197](file://backend/src/routes/tickets.js#L152-L197)

### 2. Atualização Automática de Status

Quando usuários respondem a tickets aguardando resposta, o sistema atualiza automaticamente:

```mermaid
stateDiagram-v2
[*] --> Open
Open --> InProgress : Primeira Resposta
Open --> WaitingUser : Aguardando Resposta
WaitingUser --> InProgress : Resposta do Usuário
InProgress --> Resolved : Resolvido
Resolved --> Closed : Fechado
Closed --> [*]
note right of WaitingUser
Status automático
quando usuário responde
end note
```

**Diagrama Fontes**
- [backend/src/routes/tickets.js:186-189](file://backend/src/routes/tickets.js#L186-L189)

### 3. Histórico Cronológico

O histórico de mensagens é mantido ordenado automaticamente:

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `id` | UUID | Identificador único | `uuid_generate_v4()` |
| `from` | String | Autor (`user`, `support`, `system`) | `'user'` |
| `author` | String | Email do autor | `'usuario@exemplo.com'` |
| `content` | Text | Conteúdo da mensagem | `'Preciso de ajuda com meu Apple ID'` |
| `timestamp` | DateTime | Timestamp automático | `CURRENT_TIMESTAMP` |

**Seção Fontes**
- [backend/src/routes/tickets.js:78-84](file://backend/src/routes/tickets.js#L78-L84)
- [backend/src/routes/tickets.js:175-181](file://backend/src/routes/tickets.js#L175-L181)

## Integração com Fluxo de Atendimento

### 1. Status do Ticket

Os status possíveis e suas transições:

| Status | Descrição | Transição Automática |
|--------|-----------|---------------------|
| `open` | Aberto | Primeira resposta do usuário |
| `in_progress` | Em Andamento | Qualquer resposta válida |
| `waiting_user` | Aguardando Usuário | Técnico aguarda resposta |
| `resolved` | Resolvido | Técnico marca como resolvido |
| `closed` | Fechado | Resolução finalizada |

### 2. Diferenciação de Autores

```mermaid
classDiagram
class Message {
+string id
+string from
+string author
+string content
+datetime timestamp
}
class AuthorTypes {
+USER : "user"
+SUPPORT : "support"
+SYSTEM : "system"
}
class Ticket {
+string status
+array messages
+updateStatus()
+addMessage()
}
Message --> AuthorTypes : "usa"
Ticket --> Message : "contém"
```

**Diagrama Fontes**
- [backend/src/routes/tickets.js:36-50](file://backend/src/routes/tickets.js#L36-L50)
- [backend/src/routes/tickets.js:175-181](file://backend/src/routes/tickets.js#L175-L181)

## Exemplos de Requisições

### 1. Adicionar Mensagem a um Ticket

**Endpoint:** `POST /api/v1/tickets/{ticketId}/messages`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Corpo da Requisição:**
```json
{
  "content": "Estou com dificuldades para recuperar meu Apple ID. Preciso de ajuda urgente."
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": {
    "id": "uuid-da-mensagem",
    "from": "user",
    "author": "usuario@exemplo.com",
    "content": "Estou com dificuldades para recuperar meu Apple ID. Preciso de ajuda urgente.",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Validações Realizadas

O sistema valida automaticamente:

- **Token JWT:** Verificação obrigatória para todas as operações
- **Permissões:** Apenas o criador do ticket ou técnicos/admins podem responder
- **Conteúdo:** Mensagem deve ter pelo menos 1 caractere
- **Formato:** UUID válido para ticketId

### 3. Timestamps Automáticos

Todos os timestamps são gerados automaticamente:

- `created_at`: Quando a mensagem é salva no banco
- `updated_at`: Quando o ticket é atualizado
- `timestamp`: Para cada mensagem individual

## Integração com Notificações

### 1. Fluxo de Notificações

```mermaid
sequenceDiagram
participant User as "Usuário"
participant System as "Sistema"
participant Support as "Técnico"
participant Notification as "Notificação"
User->>System : Envia mensagem
System->>System : Atualiza status
System->>Notification : Envia notificação
Notification->>Support : Alerta de nova mensagem
Notification->>User : Confirmação de recebimento
```

### 2. Tipos de Notificações

| Evento | Destinatário | Conteúdo |
|--------|-------------|----------|
| Nova Mensagem | Técnico | `Novo usuário respondeu ao ticket` |
| Status Alterado | Usuário | `Status atualizado para "Em Andamento"` |
| Resposta Técnica | Usuário | `Técnico respondeu ao ticket` |

## Melhorias e Recomendações

### 1. Segurança Adicional

- Implementar rate limiting para mensagens
- Adicionar validações de conteúdo para evitar spam
- Criptografar mensagens sensíveis

### 2. Performance

- Indexar `ticket_messages.ticket_id` para consultas rápidas
- Implementar paginação para histórico longo
- Adicionar cache para tickets recentes

### 3. Funcionalidades Futuras

- Anexos de arquivos nas mensagens
- Respostas internas (visíveis apenas para técnicos)
- Notificações push em tempo real
- Histórico de alterações de status

## Conclusão

O sistema de mensagens dentro dos tickets oferece uma solução completa para comunicação entre usuários e técnicos, com diferenciação automática de autores, atualizações de status inteligentes e histórico cronológico completo. A implementação segue boas práticas de segurança e validação, garantindo integridade e confiabilidade do fluxo de atendimento.