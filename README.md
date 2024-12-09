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
- Processamento avançado de mídia:
  - Interpretação de imagens usando visão computacional
  - Transcrição e interpretação de áudios
  - Análise de conteúdo de vídeos
  - Integração da interpretação de mídia com o contexto da conversa
- Logs detalhados de todas as operações para monitoramento
- Sistema de normalização de histórico de conversas
- Tratamento automático de diferentes tipos de mídia com prompts específicos
- Validação inteligente de mensagens usando IA
  - Verifica se as mensagens estão alinhadas com o objetivo do bot
  - Filtra mensagens inadequadas automaticamente
  - Análise das últimas 3 mensagens do contexto
- Sistema de processamento de mídia aprimorado
  - Prompts específicos para cada tipo de mídia
  - Integração automática de texto e mídia
  - Interpretação contextual de imagens, vídeos e áudios
- Gerenciamento avançado de histórico
  - Preservação do contexto inicial do sistema
  - Manutenção dos primeiros 3 mensagens importantes
  - Rotação automática mantendo as últimas 17 mensagens
- Sistema de logging detalhado
  - Registro de todas as operações do bot
  - Monitoramento de processamento de mídia
  - Acompanhamento de validações de mensagens

## Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM (Node Package Manager)
- Uma chave de API do Google Gemini (com suporte a recursos multimodais)

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
   - Processará mensagens de texto e mídia de forma inteligente usando IA
   - Manterá logs detalhados de todas as operações

4. O bot suporta diferentes tipos de mídia:
   - Imagens: analisa e descreve o conteúdo visual
   - Áudios: transcreve e interpreta o conteúdo
   - Vídeos: analisa e descreve o conteúdo
   - Combina interpretação de mídia com mensagens de texto

5. Sistema de Logs:
   - Registra cada etapa do processamento de mensagens
   - Mostra informações detalhadas sobre interpretação de mídia
   - Facilita o diagnóstico de problemas
   - Monitora o fluxo completo das conversas

## Processamento de Mídia

O bot agora possui capacidade completa de processamento de mídia:

1. Imagens:
   - Análise visual detalhada
   - Descrição do contexto e elementos
   - Integração com mensagens de texto

2. Áudios:
   - Transcrição do conteúdo
   - Interpretação do contexto
   - Suporte a mensagens de voz (PTT)

3. Vídeos:
   - Análise do conteúdo visual
   - Descrição das cenas
   - Contextualização com a conversa

4. Processamento Integrado:
   - Combina interpretação de mídia com histórico da conversa
   - Mantém contexto consistente
   - Respostas personalizadas baseadas em múltiplos inputs

## Limitações

- O bot precisa de uma conexão estável com a internet
- O WhatsApp Web precisa estar conectado
- Há um limite de tempo entre mensagens para evitar spam
- Período de cooldown de 1 hora após certas respostas específicas
- Limite de 20 mensagens no histórico por usuário
- Intervalo mínimo de 2 segundos entre mensagens
- O processamento de mídia pode levar mais tempo que mensagens de texto
- Alguns tipos de mídia podem ter limitações de tamanho ou formato

## Suporte

Se encontrar algum problema ou tiver sugestões, por favor, abra uma issue no repositório.

## Detalhes Técnicos

### Sistema de Validação de Mensagens
O bot utiliza um sistema de validação em duas camadas:
1. Validação de contexto: verifica se as mensagens estão alinhadas com o objetivo do bot
2. Análise de conteúdo: processa até 3 mensagens recentes para manter a consistência

### Processamento de Mídia Detalhado
- **Imagens**: "Descreva detalhadamente esta imagem e seu contexto"
- **Vídeos**: "Analise este vídeo e descreva seu conteúdo"
- **Áudios/PTT**: "Transcreva e interprete o conteúdo deste áudio"

### Gerenciamento de Histórico
O bot mantém um histórico otimizado por usuário:
- Preserva as 3 primeiras mensagens (contexto do sistema)
- Mantém as últimas 17 mensagens da conversa
- Remove automaticamente mensagens antigas quando excede 20 mensagens
