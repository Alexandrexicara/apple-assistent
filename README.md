# Apple ID Assistant

**Assistente Inteligente de Recuperação e Suporte Apple ID**

Um sistema profissional de suporte guiado para recuperação de acesso a contas Apple, seguindo rigorosamente os processos oficiais da Apple.

## ⚠️ Aviso Importante

Este sistema é um **assistente de suporte guiado**. Não realizamos bypass ou desbloqueio ilegal de iCloud. Todas as recuperações seguem os processos oficiais da Apple.

## 🎯 Funcionalidades

- **Recuperação de Senha**: Fluxo guiado para redefinir senha esquecida
- **Verificação 2FA**: Suporte para recuperação com verificação em duas etapas
- **Bloqueio de Ativação**: Orientação para casos de Activation Lock
- **Acompanhamento**: Painel completo para monitorar solicitações
- **Tickets de Suporte**: Sistema completo de chamados

## 🏗️ Arquitetura

```
bay-rset-tool/
├── desktop/           # Aplicação Electron (.exe)
├── core-engine/       # Motor Python (cérebro do sistema)
├── backend/           # API Node.js
├── frontend/          # Interface Web React
├── database/          # Schema e migrações
└── docs/             # Documentação
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- Python 3.8+
- PostgreSQL 14+
- Redis (opcional)

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Core Engine (Python)

```bash
cd core-engine/python
pip install -r requirements.txt
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Desktop App (Electron)

```bash
cd desktop/electron-app
npm install
npm start
```

## 📋 Fluxo do Sistema

1. **Entrada**: Usuário informa Apple ID e tipo de problema
2. **Consentimento**: Confirmação de propriedade com registro de IP
3. **Diagnóstico**: Sistema analisa o caso automaticamente
4. **Recuperação**: Fluxo guiado específico para cada tipo de problema
5. **Acompanhamento**: Painel para monitorar progresso

## 🔒 Segurança

- Criptografia de dados sensíveis
- Registro de consentimento para compliance
- Rate limiting em todas as APIs
- JWT para autenticação
- Helmet.js para headers de segurança

## 🛠️ Tecnologias

- **Frontend**: React, TailwindCSS, Zustand
- **Backend**: Node.js, Express, PostgreSQL
- **Core Engine**: Python, FastAPI
- **Desktop**: Electron
- **Database**: PostgreSQL, Redis

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 Suporte

Para suporte, abra um ticket em `/tickets` ou entre em contato pelo painel administrativo.

---

**Bay Reset Tool** - 2024
