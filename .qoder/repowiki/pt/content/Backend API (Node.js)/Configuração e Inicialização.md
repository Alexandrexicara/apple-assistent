# Configuração e Inicialização

<cite>
**Arquivos referenciados neste documento**
- [app.js](file://backend/src/app.js)
- [package.json](file://backend/package.json)
- [auth.js](file://backend/src/routes/auth.js)
- [sessions.js](file://backend/src/routes/sessions.js)
- [diagnosis.js](file://backend/src/routes/diagnosis.js)
- [tickets.js](file://backend/src/routes/tickets.js)
- [users.js](file://backend/src/routes/users.js)
- [admin.js](file://backend/src/routes/admin.js)
- [README.md](file://README.md)
</cite>

## Sumário
- Introdução
- Estrutura do Projeto
- Componentes Principais
- Visão Geral da Arquitetura
- Análise Detalhada dos Componentes
- Análise de Dependências
- Considerações de Desempenho
- Guia de Solução de Problemas
- Conclusão

## Introdução
Este documento apresenta uma documentação abrangente sobre a configuração e inicialização do backend API do projeto. Ele explora as variáveis de ambiente, middlewares de segurança, logging com Winston, compressão, inicialização do servidor, tratamento de erros global e graceful shutdown. Também inclui recomendações de configuração para desenvolvimento e produção, além de boas práticas de segurança.

## Estrutura do Projeto
O backend é uma aplicação Express configurada com middlewares de segurança, logging, compressão e limitação de requisições. As rotas são organizadas por funcionalidades (autenticação, sessões, diagnóstico, tickets, usuários e administração). O servidor é iniciado com base em variáveis de ambiente e possui tratamento de sinais para encerramento seguro.

```mermaid
graph TB
A["Express App<br/>backend/src/app.js"] --> B["Middlewares de Segurança<br/>Helmet, CORS, Rate Limit"]
A --> C["Logging com Winston<br/>backend/src/app.js"]
A --> D["Compressão<br/>backend/src/app.js"]
A --> E["Rotas<br/>backend/src/routes/*.js"]
E --> F["Autenticação<br/>backend/src/routes/auth.js"]
E --> G["Sessões<br/>backend/src/routes/sessions.js"]
E --> H["Diagnóstico<br/>backend/src/routes/diagnosis.js"]
E --> I["Tickets<br/>backend/src/routes/tickets.js"]
E --> J["Usuários<br/>backend/src/routes/users.js"]
E --> K["Administração<br/>backend/src/routes/admin.js"]
A --> L["Inicialização do Servidor<br/>backend/src/app.js"]
A --> M["Tratamento de Erros<br/>backend/src/app.js"]
A --> N["Graceful Shutdown<br/>backend/src/app.js"]
```

**Diagrama fonte**
- [app.js:56-194](file://backend/src/app.js#L56-L194)
- [auth.js:1-183](file://backend/src/routes/auth.js#L1-L183)
- [sessions.js:1-249](file://backend/src/routes/sessions.js#L1-L249)
- [diagnosis.js:1-173](file://backend/src/routes/diagnosis.js#L1-L173)
- [tickets.js:1-331](file://backend/src/routes/tickets.js#L1-L331)
- [users.js:1-168](file://backend/src/routes/users.js#L1-L168)
- [admin.js:1-235](file://backend/src/routes/admin.js#L1-L235)

**Seção fonte**
- [app.js:15-194](file://backend/src/app.js#L15-L194)
- [package.json:1-59](file://backend/package.json#L1-L59)

## Componentes Principais
- Variáveis de ambiente: PORT, NODE_ENV, JWT_SECRET, CORE_ENGINE_URL, DATABASE_URL, REDIS_URL.
- Middlewares de segurança: Helmet (CSP), CORS, Rate Limiting.
- Logging: Winston com arquivos de log e console.
- Compressão: gzip/deflate via compression.
- Inicialização do servidor: app.listen com logs informativos.
- Tratamento de erros: 404 e handler global com log detalhado.
- Graceful shutdown: SIGTERM/SIGINT.

**Seção fonte**
- [app.js:24-54](file://backend/src/app.js#L24-L54)
- [app.js:59-96](file://backend/src/app.js#L59-L96)
- [app.js:136-162](file://backend/src/app.js#L136-L162)
- [app.js:164-191](file://backend/src/app.js#L164-L191)

## Visão Geral da Arquitetura
A API é construída com Express e expõe rotas sob /api/v1. O middleware Helmet define políticas de segurança, o CORS permite origens configuráveis, e o rate limit protege contra excesso de requisições. O logging é feito com Winston e o Morgan integra logs HTTP. O servidor escuta uma porta configurável e oferece endpoints de saúde e documentação.

```mermaid
sequenceDiagram
participant Client as "Cliente"
participant App as "Express App"
participant Sec as "Segurança<br/>Helmet/CORS/RateLimit"
participant Log as "Winston/Morgan"
participant Routes as "Rotas"
participant Core as "Core Engine"
Client->>App : Requisição HTTP
App->>Sec : Aplica middlewares
Sec-->>App : Requisição validada
App->>Log : Registra log HTTP
App->>Routes : Roteamento
Routes->>Core : Chamadas externas (quando aplicável)
Core-->>Routes : Resposta
Routes-->>App : Resposta da rota
App-->>Client : Resposta HTTP
```

**Diagrama fonte**
- [app.js:59-96](file://backend/src/app.js#L59-L96)
- [app.js:111-134](file://backend/src/app.js#L111-L134)
- [sessions.js:56-87](file://backend/src/routes/sessions.js#L56-L87)
- [diagnosis.js:42-68](file://backend/src/routes/diagnosis.js#L42-L68)

**Seção fonte**
- [app.js:56-134](file://backend/src/app.js#L56-L134)

## Análise Detalhada dos Componentes

### Variáveis de Ambiente
As seguintes variáveis são utilizadas durante a inicialização e operação:
- PORT: porta do servidor (padrão 3000).
- NODE_ENV: ambiente (padrão development).
- JWT_SECRET: segredo para assinatura de tokens.
- CORE_ENGINE_URL: URL do Core Engine Python.
- DATABASE_URL: string de conexão com o banco de dados.
- REDIS_URL: string de conexão com Redis.

Boas práticas:
- Sempre defina DATABASE_URL e REDIS_URL em produção.
- Substitua o valor padrão de JWT_SECRET por uma chave forte e secreta.
- Configure ALLOWED_ORIGINS com domínios confiáveis.

**Seção fonte**
- [app.js:24-32](file://backend/src/app.js#L24-L32)
- [app.js:72-76](file://backend/src/app.js#L72-L76)

### Middlewares de Segurança
- Helmet: configura Content-Security-Policy com origens específicas, incluindo o Core Engine.
- CORS: origem configurável via ALLOWED_ORIGINS e habilita credenciais.
- Rate Limiting: limita requisições por IP; há um limitador mais restrito para autenticação.

**Seção fonte**
- [app.js:59-88](file://backend/src/app.js#L59-L88)
- [auth.js:14-20](file://backend/src/routes/auth.js#L14-L20)

### Logging com Winston
- Nível de log: info.
- Formato: JSON com timestamp e stack de erros.
- Transportes: arquivo de erro, arquivo combinado e console colorido.
- Integração com Morgan: os logs HTTP são encaminhados ao logger.

**Seção fonte**
- [app.js:34-54](file://backend/src/app.js#L34-L54)
- [app.js:95-96](file://backend/src/app.js#L95-L96)

### Compressão
- Compression ativado para reduzir o tamanho das respostas.

**Seção fonte**
- [app.js](file://backend/src/app.js#L93)

### Inicialização do Servidor
- O servidor inicia com app.listen na porta configurada.
- Após a inicialização, são registradas informações como porta, ambiente e URL do Core Engine.

**Seção fonte**
- [app.js:166-174](file://backend/src/app.js#L166-L174)

### Tratamento de Erros Global
- Middleware 404: retorna um JSON quando um endpoint não é encontrado.
- Handler global de erro: registra o erro com Winston, e responde com uma mensagem genérica em produção ou com detalhes em desenvolvimento.

**Seção fonte**
- [app.js:138-162](file://backend/src/app.js#L138-L162)

### Graceful Shutdown
- O servidor escuta SIGTERM e SIGINT para encerramento ordenado, garantindo que conexões em andamento sejam concluídas antes de sair.

**Seção fonte**
- [app.js:176-191](file://backend/src/app.js#L176-L191)

### Exemplos de Configuração por Ambiente

- Desenvolvimento
  - NODE_ENV=development
  - PORT=3000
  - JWT_SECRET=seu-segredo-for-te
  - CORE_ENGINE_URL=http://localhost:8000
  - ALLOWED_ORIGINS=http://localhost:3000
  - DATABASE_URL=postgresql://... (opcional até ser integrado)
  - REDIS_URL=redis://localhost:6379 (opcional até ser integrado)

- Produção
  - NODE_ENV=production
  - PORT=3000
  - JWT_SECRET=uma-senha-muito-longa-e-aleatória
  - CORE_ENGINE_URL=https://core-engine.example.com
  - ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
  - DATABASE_URL=postgresql://usuario:senha@host:port/db
  - REDIS_URL=redis://usuario:senha@host:port/0

Dicas:
- Em produção, utilize HTTPS e certificados válidos.
- Mantenha JWT_SECRET em segredo absoluto e rotacione periodicamente.
- Restrinja ALLOWED_ORIGINS apenas aos domínios reais.
- Configure firewalls e balanceadores para limitar portas e tráfego.

**Seção fonte**
- [app.js:24-32](file://backend/src/app.js#L24-L32)
- [app.js:72-76](file://backend/src/app.js#L72-L76)
- [README.md:40-47](file://README.md#L40-L47)

### Boas Práticas de Segurança
- Utilize Helmet com CSP restritiva.
- Configure CORS somente para domínios confiáveis.
- Implemente rate limiting para todas as rotas críticas.
- Evite expor detalhes de erro em produção.
- Armazene senhas com hash e tokens com expiração.
- Monitore logs e alertas de segurança.

**Seção fonte**
- [app.js:59-88](file://backend/src/app.js#L59-L88)
- [app.js:147-162](file://backend/src/app.js#L147-L162)
- [auth.js:25-42](file://backend/src/routes/auth.js#L25-L42)

## Análise de Dependências
O backend depende de pacotes para segurança, logging, compressão, validação e autenticação. A inicialização do app carrega dotenv para carregar as variáveis de ambiente.

```mermaid
graph TB
P["package.json<br/>backend/package.json"] --> E["express"]
P --> H["helmet"]
P --> C["cors"]
P --> RL["express-rate-limit"]
P --> M["morgan"]
P --> W["winston"]
P --> CP["compression"]
P --> D["dotenv"]
APP["app.js<br/>backend/src/app.js"] --> D
APP --> E
APP --> H
APP --> C
APP --> RL
APP --> M
APP --> W
APP --> CP
```

**Diagrama fonte**
- [package.json:23-46](file://backend/package.json#L23-L46)
- [app.js:15-22](file://backend/src/app.js#L15-L22)

**Seção fonte**
- [package.json:1-59](file://backend/package.json#L1-L59)
- [app.js:15-22](file://backend/src/app.js#L15-L22)

## Considerações de Desempenho
- A compressão pode reduzir o tamanho das respostas, mas tenha atenção ao tamanho máximo de corpo (JSON e URL-encoded limitados).
- O rate limit ajuda a evitar sobrecarga, mas evite valores muito baixos em rotas críticas.
- Para produção, considere adicionar cache (ex: Redis) e balanceamento de carga.

[Sem fonte, pois esta seção fornece orientações gerais]

## Guia de Solução de Problemas
- Erros de autenticação: verifique se o JWT_SECRET está correto e se o token foi enviado no cabeçalho Authorization.
- Erros de CORS: confirme que ALLOWED_ORIGINS inclui o domínio do frontend e que credenciais estão habilitadas.
- Erros de conexão com Core Engine: verifique se CORE_ENGINE_URL aponta para o endereço correto e se o serviço está acessível.
- Logs de erro: consulte os arquivos de log gerados pelo Winston e os logs HTTP do Morgan.

**Seção fonte**
- [auth.js:25-42](file://backend/src/routes/auth.js#L25-L42)
- [app.js:72-76](file://backend/src/app.js#L72-L76)
- [sessions.js:56-87](file://backend/src/routes/sessions.js#L56-L87)
- [app.js:34-54](file://backend/src/app.js#L34-L54)
- [app.js:95-96](file://backend/src/app.js#L95-L96)

## Conclusão
O backend foi configurado com práticas recomendadas de segurança, logging e controle de tráfego. A inicialização é simples e flexível, com variáveis de ambiente para diferentes ambientes. Para produção, siga as recomendações de segurança e disponibilidade, e integre os serviços de banco de dados e Redis conforme a arquitetura do projeto.

[Sem fonte, pois esta seção resume sem análise de arquivos específicos]