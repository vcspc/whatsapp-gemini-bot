const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Importa bibliotecas necessárias
// - whatsapp-web.js: biblioteca para interagir com o WhatsApp
// - qrcode-terminal: biblioteca para gerar QR code no terminal
// - @google/generative-ai: biblioteca para interagir com a API do Gemini AI
// - dotenv: biblioteca para ler variáveis de ambiente do arquivo .env

// Cria o cliente WhatsApp com autenticação local
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});
// - authStrategy: estratégia de autenticação do cliente (neste caso, LocalAuth)
// - puppeteer: configuração do Puppeteer (biblioteca para controlar o navegador)

// Cria o objeto para interagir com a API do Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// - process.env.GEMINI_API_KEY: variável de ambiente com a chave API do Gemini

// Array de números de telefone permitidos
const allowedPhoneNumbers = process.env.ALLOWED_PHONE_NUMBERS 
    ? process.env.ALLOWED_PHONE_NUMBERS.split(',')
    : [];

// System prompt para definir o comportamento do bot
const systemPrompt = process.env.SYSTEM_PROMPT;

// Map para armazenar nomes dos usuários
const userNames = new Map();

// Map para armazenar histórico de conversas por usuário
const conversationHistory = new Map();

// Mensagens que ativam o cooldown
const cooldownTriggerMessages = process.env.COOLDOWN_TRIGGER_MESSAGES 
    ? JSON.parse(process.env.COOLDOWN_TRIGGER_MESSAGES)
    : ["Vou repassar para o doutor Vinícius"];

// Map para armazenar tempos de cooldown por usuário
const userCooldowns = new Map();

// Variável para controlar o tempo da última mensagem
let lastMessageTime = 0;
const MIN_TIME_BETWEEN_MESSAGES = 2000; // 2 segundos

// Função para verificar e definir cooldown
function handleCooldown(response, userId) {
    // Verifica se a resposta contém alguma das frases de cooldown
    const shouldTriggerCooldown = cooldownTriggerMessages.some(message => 
        response.includes(message)
    );

    if (shouldTriggerCooldown) {
        const cooldownTime = Date.now() + (60 * 60 * 1000); // 1 hora em milissegundos
        userCooldowns.set(userId, cooldownTime);
        return true;
    }
    return false;
}

// Função para verificar se usuário está em cooldown
function isUserInCooldown(userId) {
    const cooldownTime = userCooldowns.get(userId);
    if (!cooldownTime) return false;
    
    if (Date.now() < cooldownTime) {
        return true;
    } else {
        userCooldowns.delete(userId);
        return false;
    }
}

// Evento quando o QR code é gerado
client.on('qr', (qr) => {
    console.log('QR Code gerado! Escaneie-o com seu WhatsApp:');
    qrcode.generate(qr, { small: true });
});
// - qrcode.generate: gera o QR code no terminal

// Evento quando o cliente está pronto
client.on('ready', () => {
    console.log('Cliente WhatsApp está pronto!');
});

// Função para gerar resposta usando Gemini
async function generateResponse(message, userName, userId) {
    try {
        // Cria um modelo do Gemini AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Obtém ou inicializa o histórico do usuário
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, [
                {
                    role: "user",
                    parts: "Por favor, confirme que entendeu suas instruções respondendo apenas 'Entendido'.",
                },
                {
                    role: "model",
                    parts: "Entendido",
                },
                {
                    role: "user",
                    parts: `O Nome do Paciente é ${userName}`,
                },
            ]);
        }

        // Cria o chat com o histórico existente
        const chat = model.startChat({
            history: conversationHistory.get(userId),
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
            },
        });

        // Adiciona o system prompt apenas se for a primeira mensagem
        if (conversationHistory.get(userId).length <= 3) {
            await chat.sendMessage(systemPrompt);
            const initialResponse = await chat.getHistory();
            conversationHistory.set(userId, initialResponse);
        }

        // Gera uma resposta baseada na mensagem recebida
        const result = await chat.sendMessage(message);
        const response = await result.response;
        
        // Atualiza o histórico com a nova interação
        const updatedHistory = await chat.getHistory();
        conversationHistory.set(userId, updatedHistory);
        
        // Limita o histórico para evitar tokens excessivos (mantém últimas 10 mensagens)
        if (updatedHistory.length > 20) {
            const trimmedHistory = [
                ...updatedHistory.slice(0, 3), // Mantém as 3 primeiras mensagens (setup inicial)
                ...updatedHistory.slice(-17) // Mantém as últimas 17 mensagens
            ];
            conversationHistory.set(userId, trimmedHistory);
        }
        
        // Retorna a resposta
        return response.text();
    } catch (error) {
        // Caso ocorra um erro, retorna uma mensagem de erro
        console.error('Erro ao gerar resposta:', error);
        if (error.message.includes('429') || error.message.includes('quota')) {
            return "Desculpe, o limite de mensagens foi atingido. Por favor, tente novamente mais tarde.";
        }
        return "Desculpe, não consegui processar sua mensagem no momento.";
    }
}

// Evento para processar mensagens recebidas
client.on('message', async (message) => {
    try {
        // Get chat information
        const chat = await message.getChat();
        
        // Registra mensagem recebida e detalhes do chat
        // console.log('\n=== Message and Chat Details ===');
        // console.log('Chat Object:', JSON.stringify(chat, null, 2));
        // console.log('Message Object:', JSON.stringify(message, null, 2));
        // console.log('================================\n');

        // Verifica se a mensagem é de um chat individual
        console.log('Mensagem recebida de:', message.from);
        
        // Ignora qualquer chat que não seja individual ou não esteja na lista de permitidos
        if (chat.id.server !== 'c.us' || !allowedPhoneNumbers.includes(message.from)) {
            console.log('Mensagem ignorada: não é um chat individual permitido');
            return;
        }

        // Verifica se o usuário está em cooldown
        if (isUserInCooldown(message.from)) {
            console.log('Usuário em cooldown, ignorando mensagem');
            return;
        }

        // Verifica o intervalo entre mensagens
        const now = Date.now();
        if (now - lastMessageTime < MIN_TIME_BETWEEN_MESSAGES) {
            console.log('Aguardando intervalo entre mensagens...');
            await new Promise(resolve => setTimeout(resolve, MIN_TIME_BETWEEN_MESSAGES));
        }
        lastMessageTime = now;

        // Captura o nome do usuário se for a primeira mensagem
        if (!userNames.has(message.from)) {
            const contact = await message.getContact();
            const userName = contact.pushname || 'Usuário';
            userNames.set(message.from, userName);
            console.log(`Novo usuário registrado: ${userName}`);
        }

        console.log(`Mensagem recebida de chat individual permitido: ${message.body}`);
        
        // Gera resposta usando Gemini
        const userName = userNames.get(message.from);
        const response = await generateResponse(message.body, userName, message.from);
        
        // Verifica se a resposta deve ativar o cooldown
        const shouldCooldown = handleCooldown(response, message.from);
        
        // Envia a resposta usando sendMessage ao invés de reply
        await client.sendMessage(message.from, response);
        
        if (shouldCooldown) {
            console.log(`Cooldown ativado para usuário ${message.from}`);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        await client.sendMessage(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem.');
    }
});

// Inicia o cliente
client.initialize();
