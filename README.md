# WhatsApp Gemini Bot

Bot de WhatsApp integrado com Gemini AI para atendimento automatizado.

## Funcionalidades

### Sistema de Autorização
- Filtragem de números permitidos/bloqueados via arquivo `.env`
- Bloqueio automático de mensagens de grupo (apenas chats privados permitidos)
- Modo de filtragem configurável: 'allowed' ou 'blocked'

### Sistema de Cooldown
- Cooldown automático após mensagens específicas
- Duração do cooldown: 1 hora
- Mensagens que ativam cooldown configuráveis via `.env`
- Rate limiting para evitar spam (2 segundos entre mensagens)

### Sistema de Logging
- Registro detalhado de todas as interações em arquivo de log
- Formato de data e hora no padrão brasileiro (UTC-3)
- Logs organizados por tipo de evento:
  - MENSAGEM RECEBIDA
  - AUTORIZAÇÃO
  - VALIDAÇÃO
  - PROCESSAMENTO
  - MENSAGEM ENVIADA
  - ERRO
  - COOLDOWN
- Registro de todas as mensagens, incluindo bloqueadas
- Localização dos logs: `logs/whatsapp-bot.log`

### Integração com Gemini AI
- Processamento de mensagens via Gemini 1.5 Flash
- Temperatura configurável para respostas
- Sistema de prompt personalizado
- Validação de contexto das mensagens
- Processamento de mídia (imagens, vídeos, áudio)

### Gerenciamento de Usuários
- Sistema de histórico de conversas
- Limite de 20 mensagens no histórico por usuário
- Identificação de usuários por nome/número

## Configuração

### Variáveis de Ambiente (.env)
```env
# Configuração da API Gemini
GEMINI_API_KEY=sua_chave_api
GEMINI_TEMPERATURE=0.4

# Configuração do Sistema de Prompt
SYSTEM_PROMPT="seu_prompt_aqui"

# Configuração de Cooldown
COOLDOWN_TRIGGER_MESSAGES=["mensagem1", "mensagem2"]

# Configuração de Filtro de Números
PHONE_FILTER_MODE=allowed  # ou 'blocked'
ALLOWED_PHONE_NUMBERS=numero1@c.us,numero2@c.us
BLOCKED_PHONE_NUMBERS=numero3@c.us,numero4@c.us
```

## Formato dos Logs

```log
[DD/MM/YYYY HH:mm:ss] [TIPO] [User: Nome (ID)] Mensagem
```

Exemplo:
```log
[20/01/2024 14:30:45] [MENSAGEM RECEBIDA] [User: João (5511999999999@c.us)] Conteúdo: Olá, bom dia!
[20/01/2024 14:30:45] [AUTORIZAÇÃO] [User: João (5511999999999@c.us)] Tentativa de acesso: AUTORIZADO
[20/01/2024 14:30:46] [MENSAGEM ENVIADA] [User: João (5511999999999@c.us)] Conteúdo: *assistente virtual:* Bom dia! Como posso ajudar?
```

## Segurança
- Bloqueio automático de mensagens de grupo
- Filtragem de números por whitelist/blacklist
- Rate limiting para prevenção de spam
- Sistema de cooldown para controle de fluxo
- Validação de contexto das mensagens

## Tratamento de Erros
- Registro detalhado de erros no log
- Respostas amigáveis para usuários em caso de erro
- Tratamento de desconexões e reconexões
- Encerramento gracioso do bot

## Requisitos do Sistema
- Node.js
- NPM ou Yarn
- Acesso à API do Gemini
- WhatsApp conectado

## Instalação

1. Clone o repositório
```bash
git clone [url-do-repositorio]
```

2. Instale as dependências
```bash
npm install
```

3. Configure o arquivo .env
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Inicie o bot
```bash
npm start
```

## Manutenção

### Arquivos de Log
- Os logs são armazenados em `logs/whatsapp-bot.log`
- Recomenda-se rotação periódica dos logs
- Backup regular dos logs para análise

### Monitoramento
- Verificar regularmente os logs de erro
- Monitorar uso da API do Gemini
- Acompanhar padrões de uso e bloqueios
