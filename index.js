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

// Função para gerar resposta usando Gemini
async function generateResponse(message) {
    try {
        // Cria um modelo do Gemini AI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

        // Cria o chat com o system prompt
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: "Por favor, confirme que entendeu suas instruções respondendo apenas 'Entendido'.",
                },
                {
                    role: "model",
                    parts: "Entendido",
                },
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // Adiciona o system prompt
        await chat.sendMessage(systemPrompt);

        // Gera uma resposta baseada na mensagem recebida
        const result = await chat.sendMessage(message);
        const response = await result.response;
        
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

// Variável para controlar o tempo da última mensagem
let lastMessageTime = 0;
const MIN_TIME_BETWEEN_MESSAGES = 2000; // 2 segundos

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

// Evento para processar mensagens recebidas
client.on('message', async (message) => {
    try {
        // Ignora mensagens do proprio bot
        // if (message.fromMe) return;

        // Verifica se a mensagem é de um chat individual
        const chat = await message.getChat();

        console.log('Mensagem recebida de:', message.from);
        
        // Ignora qualquer chat que não seja individual ou não esteja na lista de permitidos
        if (chat.id.server !== 'c.us' || !allowedPhoneNumbers.includes(message.from)) {
            console.log('Mensagem ignorada: não é um chat individual permitido');
            return;
        }

        // Verifica o intervalo entre mensagens
        const now = Date.now();
        if (now - lastMessageTime < MIN_TIME_BETWEEN_MESSAGES) {
            console.log('Aguardando intervalo entre mensagens...');
            await new Promise(resolve => setTimeout(resolve, MIN_TIME_BETWEEN_MESSAGES));
        }
        lastMessageTime = now;

        console.log(`Mensagem recebida de chat individual permitido: ${message.body}`);
        
        // Gera resposta usando Gemini
        const response = await generateResponse(message.body);
        
        // Envia a resposta usando sendMessage ao invés de reply
        await client.sendMessage(message.from, response);
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        await client.sendMessage(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem.');
    }
});

// Inicia o cliente
client.initialize();
