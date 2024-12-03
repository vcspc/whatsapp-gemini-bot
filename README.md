# WhatsApp Gemini Bot

Bot para WhatsApp que utiliza a API do Google Gemini para gerar respostas inteligentes.

## Funcionalidades

- Integração com WhatsApp Web
- Respostas geradas pela IA Gemini da Google
- Sistema flexível de filtragem de números (modo permitido ou bloqueado)
- Personalização do comportamento do bot através de variáveis de ambiente
- Controle de acesso por números de telefone permitidos
- Histórico de conversas persistente por usuário
- Gerenciamento automático de contexto das conversas
- Sistema de cooldown automático após certas respostas
- Controle de intervalo mínimo entre mensagens (anti-spam)
- Registro automático de nomes de usuários
- Limite de 20 mensagens no histórico por usuário para otimização
- Tratamento de erros e mensagens de fallback
- Suporte a múltiplos gatilhos de cooldown personalizáveis
- Tratamento automático de mensagens de mídia (áudio, imagem e vídeo)

## Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM (Node Package Manager)
- Uma chave de API do Google Gemini

## Instalação

1. Clone o repositório:
```bash
git clone [seu-repositorio]
cd whatsapp-gemini-bot
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione as seguintes variáveis:
```env
GEMINI_API_KEY=sua_chave_api_aqui
SYSTEM_PROMPT="Defina aqui a personalidade do seu bot"
GEMINI_TEMPERATURE=0.5     # Controla a criatividade das respostas (0.0 a 1.0)
COOLDOWN_TRIGGER_MESSAGES=["mensagem1", "mensagem2"]  # Lista de mensagens que ativam o cooldown

# Configuração de filtragem de números
PHONE_FILTER_MODE=allowed  # Opções: allowed (permitido) ou blocked (bloqueado)
ALLOWED_PHONE_NUMBERS=numero1@c.us,numero2@c.us  # Lista de números permitidos
BLOCKED_PHONE_NUMBERS=numero3@c.us,numero4@c.us  # Lista de números bloqueados
```

Observações sobre as variáveis de ambiente:
- `GEMINI_API_KEY`: Sua chave de API do Google Gemini
- `PHONE_FILTER_MODE`: Define o modo de filtragem de números
  - `allowed`: Apenas números na lista ALLOWED_PHONE_NUMBERS podem usar o bot
  - `blocked`: Todos os números podem usar o bot, exceto os da lista BLOCKED_PHONE_NUMBERS
- `ALLOWED_PHONE_NUMBERS`: Lista de números permitidos (quando PHONE_FILTER_MODE=allowed)
- `BLOCKED_PHONE_NUMBERS`: Lista de números bloqueados (quando PHONE_FILTER_MODE=blocked)
- `SYSTEM_PROMPT`: Define a personalidade e comportamento do bot
- `GEMINI_TEMPERATURE`: Quanto maior o valor, mais criativas e variadas serão as respostas
- `COOLDOWN_TRIGGER_MESSAGES`: Array de mensagens que, quando enviadas pelo bot, ativam um período de cooldown de 1 hora para o usuário

## Como Usar

1. Inicie o bot:
```bash
node index.js
```

2. Escaneie o QR Code que aparecerá no terminal usando o WhatsApp do seu celular:
   - Abra o WhatsApp
   - Vá em Menu > WhatsApp Web
   - Escaneie o QR Code

3. Após a autenticação, o bot estará ativo e:
   - Manterá o contexto das conversas anteriores
   - Responderá de forma personalizada usando o nome do usuário
   - Processará as mensagens de forma inteligente usando IA

4. O bot mantém um histórico das últimas 20 interações por usuário para:
   - Manter contexto relevante da conversa
   - Personalizar respostas com base no histórico
   - Otimizar o uso de tokens da API

## Segurança

- O bot só responderá a mensagens de números listados em `ALLOWED_PHONE_NUMBERS` (quando PHONE_FILTER_MODE=allowed) ou todos os números exceto os da lista `BLOCKED_PHONE_NUMBERS` (quando PHONE_FILTER_MODE=blocked)
- As credenciais são armazenadas localmente de forma segura
- O arquivo `.env` não é versionado no git para proteger informações sensíveis

## Limitações

- O bot precisa de uma conexão estável com a internet
- O WhatsApp Web precisa estar conectado
- Há um limite de tempo entre mensagens para evitar spam
- Período de cooldown de 1 hora após certas respostas específicas
- Limite de 20 mensagens no histórico por usuário
- Intervalo mínimo de 2 segundos entre mensagens
- Não processa mensagens de mídia (áudio, imagem ou vídeo), solicitando ao usuário que envie mensagens de texto

## Suporte

Se encontrar algum problema ou tiver sugestões, por favor, abra uma issue no repositório.
