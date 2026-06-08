# Atualizações Automáticas

<cite>
**Arquivos Referenciados neste Documento**
- [package.json](file://desktop/electron-app/package.json)
- [main.js](file://desktop/electron-app/main.js)
- [preload.js](file://desktop/electron-app/preload.js)
- [app.js](file://desktop/electron-app/renderer/app.js)
- [README.md](file://README.md)
</cite>

## Sumário
- **Objetivo**: Documentar o sistema de atualizações automáticas baseado em electron-updater
- **Escopo**: Implementação completa, eventos, notificação ao renderer, tratamento de erros e configurações de build
- **Plataformas**: Windows (NSIS), com possibilidade de extensão para outras plataformas

## Introdução

O sistema de atualizações automáticas do Apple ID Assistant utiliza a biblioteca electron-updater para fornecer atualizações transparentes e seguras para os usuários finais. O sistema foi projetado para funcionar de forma totalmente automática em produção, com notificação proativa ao usuário durante todo o processo de atualização.

## Arquitetura do Sistema de Atualizações

```mermaid
graph TB
subgraph "Aplicação Electron"
A[Main Process<br/>main.js]
B[Preload Script<br/>preload.js]
C[Renderer Process<br/>renderer/app.js]
end
subgraph "Biblioteca de Atualização"
D[electron-updater<br/>AutoUpdater]
E[GitHub Provider<br/>Releases]
end
subgraph "Sistema Operacional"
F[Windows NSIS Installer]
G[Atualização Automática]
end
A --> D
D --> E
A --> B
B --> C
D --> F
F --> G
G --> A
```

**Fontes**: 
- [main.js:254-286](file://desktop/electron-app/main.js#L254-L286)
- [package.json:34-71](file://desktop/electron-app/package.json#L34-L71)

## Componentes Principais

### 1. Configuração do electron-updater

O electron-updater é configurado através do arquivo de build do electron-builder:

```mermaid
classDiagram
class AutoUpdaterConfig {
+string provider : "github"
+string owner : "bayreset"
+string repo : "apple-id-assistant"
+string updateURL : "https : //github.com/bayreset/apple-id-assistant/releases/latest"
+string publish : GitHubProvider
}
class GitHubProvider {
+string owner : "bayreset"
+string repo : "apple-id-assistant"
+string releaseType : "latest"
+string token : "process.env.GITHUB_TOKEN"
}
class BuildConfig {
+string appId : "com.bayreset.appleidassistant"
+string productName : "Apple ID Assistant"
+string target : "nsis"
+string arch : ["x64", "ia32"]
+boolean oneClick : false
+boolean allowToChangeInstallationDirectory : true
}
AutoUpdaterConfig --> GitHubProvider
BuildConfig --> AutoUpdaterConfig
```

**Fontes**: 
- [package.json:66-70](file://desktop/electron-app/package.json#L66-L70)
- [package.json:34-65](file://desktop/electron-app/package.json#L34-L65)

### 2. Eventos do AutoUpdater

O sistema implementa os seguintes eventos principais:

```mermaid
sequenceDiagram
participant App as Aplicação
participant Updater as AutoUpdater
participant GitHub as GitHub Releases
participant Renderer as Renderer Process
App->>Updater : checkForUpdatesAndNotify()
Updater->>GitHub : Verificar releases
GitHub-->>Updater : Status da atualização
alt Atualização Disponível
Updater->>Renderer : update-available
Renderer->>Renderer : Exibir notificação
else Nenhuma Atualização
Updater->>App : update-not-available
else Erro
Updater->>App : error
App->>App : Registrar log de erro
end
Updater->>GitHub : Baixar atualização
loop Progresso do Download
Updater->>Renderer : download-progress
Renderer->>Renderer : Atualizar barra de progresso
end
Updater->>App : update-downloaded
App->>App : quitAndInstall()
App->>Renderer : Fechar e reiniciar
```

**Fontes**: 
- [main.js:256-286](file://desktop/electron-app/main.js#L256-L286)
- [preload.js:23-25](file://desktop/electron-app/preload.js#L23-L25)

### 3. Comunicação IPC

```mermaid
flowchart TD
A[Main Process] --> B[IPC Handler]
B --> C[Renderer Process]
C --> D[Event Listener]
D --> E[UI Update]
subgraph "Eventos"
F[update-available]
G[download-progress]
H[update-downloaded]
end
B --> F
B --> G
B --> H
F --> D
G --> D
H --> D
```

**Fontes**: 
- [main.js:256-286](file://desktop/electron-app/main.js#L256-L286)
- [preload.js:23-25](file://desktop/electron-app/preload.js#L23-L25)

## Implementação Detalhada

### 1. Inicialização do Sistema

O sistema é inicializado no processo principal com verificação automática em produção:

```mermaid
flowchart TD
A[App Ready] --> B{Ambiente}
B --> |Production| C[checkForUpdatesAndNotify]
B --> |Development| D[Não verificar]
C --> E[Verificar Releases]
E --> F{Atualização Disponível?}
F --> |Sim| G[Notificar Usuário]
F --> |Não| H[Nenhuma Atualização]
G --> I[Iniciar Download]
I --> J[Monitorar Progresso]
J --> K[Instalar Automaticamente]
```

**Fontes**: 
- [main.js:82-89](file://desktop/electron-app/main.js#L82-L89)
- [main.js:256-286](file://desktop/electron-app/main.js#L256-L286)

### 2. Eventos de Atualização

#### Evento: checking-for-update
- **Descrição**: Início da verificação de atualizações
- **Comportamento**: Registra no log apenas
- **Uso**: Indica início do processo de verificação

#### Evento: update-available
- **Descrição**: Atualização encontrada
- **Comportamento**: Envia evento para renderer e registra no log
- **Dados**: Informações da atualização (versão, tamanho, etc.)

#### Evento: update-not-available
- **Descrição**: Nenhuma atualização disponível
- **Comportamento**: Registra no log
- **Uso**: Finaliza processo sem ações

#### Evento: error
- **Descrição**: Erro durante o processo de atualização
- **Comportamento**: Registra erro no log
- **Tratamento**: Nenhum tratamento automático

#### Evento: download-progress
- **Descrição**: Progresso do download
- **Comportamento**: Envia progresso para renderer e registra no log
- **Dados**: Porcentagem, velocidade, tamanho total

#### Evento: update-downloaded
- **Descrição**: Download concluído
- **Comportamento**: Chama quitAndInstall() para reiniciar automaticamente
- **Resultado**: Aplicação fecha e instala a nova versão

**Fontes**: 
- [main.js:256-286](file://desktop/electron-app/main.js#L256-L286)

### 3. Notificação ao Renderer

O renderer recebe notificações através de handlers IPC:

```mermaid
classDiagram
class ElectronAPI {
+onUpdateAvailable(callback)
+onDownloadProgress(callback)
+removeAllListeners(channel)
}
class UpdateHandler {
+handleUpdateAvailable(info)
+handleDownloadProgress(progress)
+showUpdateNotification()
+updateProgressBar(percent)
+restartApplication()
}
class UIComponents {
+updateModal : Modal de Atualização
+progressBar : Barra de Progresso
+statusText : Texto de Status
}
ElectronAPI --> UpdateHandler
UpdateHandler --> UIComponents
```

**Fontes**: 
- [preload.js:23-29](file://desktop/electron-app/preload.js#L23-L29)
- [app.js:571-585](file://desktop/electron-app/renderer/app.js#L571-L585)

## Configurações de Build

### 1. Configurações do electron-builder

O projeto utiliza o electron-builder para empacotar e publicar atualizações:

```mermaid
graph LR
A[electron-builder] --> B[Windows NSIS]
A --> C[Configurações de Build]
C --> D[Arquivos Empacotados]
C --> E[Publicação GitHub]
D --> F[Instalador Executável]
E --> G[Releases GitHub]
G --> H[Atualizações Automáticas]
```

**Fontes**: 
- [package.json:34-71](file://desktop/electron-app/package.json#L34-L71)

### 2. Configurações de Publicação

- **Provider**: GitHub
- **Owner**: bayreset
- **Repository**: apple-id-assistant
- **Release Type**: Latest
- **Token**: Process.env.GITHUB_TOKEN (variável de ambiente)

### 3. Configurações de Build para Windows

- **Target**: NSIS (Nullsoft Scriptable Install System)
- **Arquiteturas**: x64 e ia32
- **Instalação**: Interativa (oneClick: false)
- **Atalhos**: Desktop e Menu Iniciar
- **Diretório de Instalação**: Personalizável

## Tratamento de Erros

### 1. Erros Comuns

```mermaid
flowchart TD
A[Erro no AutoUpdater] --> B{Tipo de Erro}
B --> |Conexão| C[Verificar Internet]
B --> |Autenticação| D[Verificar Token GitHub]
B --> |Arquivo Corrompido| E[Reiniciar Verificação]
B --> |Permissões| F[Verificar Permissões de Arquivo]
C --> G[Tentar Novamente]
D --> H[Configurar Variável de Ambiente]
E --> I[Forçar Nova Verificação]
F --> J[Corrigir Permissões]
G --> K[Sucesso]
H --> K
I --> K
J --> K
```

### 2. Logs de Erro

Todos os erros são registrados no log do electron-log com níveis apropriados:

- **Nível de Log**: info (padrão)
- **Arquivo de Log**: logs automáticos do electron-log
- **Informações Registradas**: Timestamp, tipo de erro, contexto

**Fontes**: 
- [main.js:271-273](file://desktop/electron-app/main.js#L271-L273)

## Considerações para Produção

### 1. Ambiente de Produção

- **Verificação Automática**: Ativada apenas em produção
- **Variável de Ambiente**: NODE_ENV = production
- **Comportamento**: Verificação imediata após inicialização

### 2. Segurança

- **Verificação de Assinatura**: As atualizações são assinadas pelo GitHub
- **HTTPS**: Todos os downloads ocorrem via HTTPS
- **Integridade**: Verificação de integridade dos pacotes

### 3. Desempenho

- **Download Paralelo**: O electron-updater otimiza o download
- **Progresso em Tempo Real**: Feedback imediato ao usuário
- **Memória**: Baixo consumo durante o processo

## Fluxo Completo de Atualização

### 1. Fluxo de Atualização Automática

```mermaid
sequenceDiagram
participant User as Usuário
participant App as Aplicação
participant Updater as AutoUpdater
participant GitHub as GitHub
participant Installer as Instalador
User->>App : Iniciar Aplicação
App->>Updater : checkForUpdatesAndNotify()
Updater->>GitHub : Verificar Releases
GitHub-->>Updater : Nova Versão Disponível
Updater->>App : update-available
App->>User : Notificação de Atualização
User->>App : Confirmar Atualização
App->>Updater : Iniciar Download
Updater->>GitHub : Baixar Atualização
loop Progresso
Updater->>App : download-progress
App->>User : Atualizar Barra de Progresso
end
Updater->>App : update-downloaded
App->>Installer : quitAndInstall()
Installer->>User : Instalação Automática
Installer->>App : Reiniciar Aplicação
```

### 2. Fluxo de Erro

```mermaid
flowchart TD
A[Iniciar Atualização] --> B[Verificar Conexão]
B --> C{Conexão OK?}
C --> |Não| D[Registrar Erro]
C --> |Sim| E[Baixar Atualização]
E --> F{Download OK?}
F --> |Não| G[Registrar Erro]
F --> |Sim| H[Instalar Atualização]
H --> I{Instalação OK?}
I --> |Não| J[Registrar Erro]
I --> |Sim| K[Aplicação Reiniciada]
D --> L[Tentar Novamente Mais Tarde]
G --> M[Exibir Mensagem de Erro]
J --> M
L --> N[Fim do Processo]
M --> N
K --> N
```

## Melhores Práticas

### 1. Configuração de Ambiente

- **Variáveis de Ambiente**: Configurar GITHUB_TOKEN para releases privadas
- **Testes**: Realizar testes em ambiente de staging antes de produção
- **Backup**: Manter backup da versão anterior durante atualização

### 2. Monitoramento

- **Logs**: Monitorar logs de atualização regularmente
- **Feedback**: Coletar feedback dos usuários sobre atualizações
- **Relatórios**: Manter registros de falhas e sucesso

### 3. Manutenção

- **Versões**: Manter compatibilidade com versões anteriores
- **Depuração**: Testar atualizações em diferentes cenários
- **Documentação**: Atualizar documentação conforme mudanças

## Conclusão

O sistema de atualizações automáticas do Apple ID Assistant oferece uma solução robusta e segura para manter a aplicação sempre atualizada. Com a implementação completa do electron-updater, notificação proativa ao usuário e tratamento adequado de erros, o sistema proporciona uma experiência de atualização transparente e confiável.

As configurações de build para Windows (NSIS) e a integração com o GitHub Releases garantem um processo de atualização automatizado e confiável, enquanto os eventos e callbacks permitem uma experiência personalizada para o usuário final.