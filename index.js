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

// Configuração dos números de telefone permitidos/bloqueados
const PHONE_FILTER_MODE = process.env.PHONE_FILTER_MODE || 'allowed';
const ALLOWED_PHONE_NUMBERS = (process.env.ALLOWED_PHONE_NUMBERS || '').split(',').filter(Boolean);
const BLOCKED_PHONE_NUMBERS = (process.env.BLOCKED_PHONE_NUMBERS || '').split(',').filter(Boolean);

// Função para verificar se o número está permitido
function isPhoneNumberAllowed(phoneNumber) {
    if (PHONE_FILTER_MODE === 'allowed') {
        return ALLOWED_PHONE_NUMBERS.length === 0 || ALLOWED_PHONE_NUMBERS.includes(phoneNumber);
    } else {
        return !BLOCKED_PHONE_NUMBERS.includes(phoneNumber);
    }
}

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
    // Verifica se response existe e é uma string
    if (!response || typeof response !== 'string') {
        return false;
    }

    const shouldTriggerCooldown = cooldownTriggerMessages.some(message => 
        response.includes(message)
    );

    if (shouldTriggerCooldown) {
        const cooldownTime = Date.now() + (60 * 60 * 1000);
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

// Função para interpretar mídia usando Gemini
async function interpretMedia(mediaData, messageText = '') {
    console.log('\n=== Iniciando Interpretação de Mídia ===');
    console.log(`Tipo de mídia: ${mediaData.type}`);
    console.log(`Mensagem de texto anexada: ${messageText || 'Nenhuma'}`);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        let prompt = '';
        switch (mediaData.type) {
            case 'image':
                prompt = 'Descreva detalhadamente esta imagem e seu contexto. ';
                break;
            case 'video':
                prompt = 'Analise este vídeo e descreva seu conteúdo. ';
                break;
            case 'audio':
            case 'ptt':
                prompt = 'Transcreva e interprete o conteúdo deste áudio. ';
                break;
        }

        prompt += messageText ? `Considere também esta mensagem do usuário: ${messageText}` : '';
        console.log('Prompt para interpretação:', prompt);

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: mediaData.mimetype,
                    data: mediaData.data
                }
            }
        ]);

        const response = await result.response;
        const interpretedText = response.text();
        console.log('Interpretação concluída:', interpretedText.substring(0, 100) + '...');
        console.log('=== Fim da Interpretação de Mídia ===\n');
        
        return interpretedText;
    } catch (error) {
        console.error('Erro ao interpretar mídia:', error);
        return 'Não foi possível interpretar a mídia enviada.';
    }
}

async function validateUserMessages(messages, systemPrompt) {
    console.log('\n=== Iniciando Validação de Mensagens ===');
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

        for (let i = 0; i < Math.min(3, messages.length); i++) {
            const message = messages[i];
            console.log(`Analisando mensagem: ${message}`);

            const prompt = `Verifique se a seguinte mensagem está alinhada com o objetivo do chatbot: "${systemPrompt}". Mensagem: "${message}". Se não está alinhada, responda com "não". Se está alinhada, responda com "sim".`;
            const result = await model.generateContent([{ text: prompt }]);
            const response = await result.response;
            const analysis = response.text();

            console.log(`Análise da mensagem: ${analysis}`);

            if (!analysis.includes("sim")) {
                console.log('Mensagem não está alinhada');
                return false;
            }
        }

        console.log('Todas as mensagens estão alinhadas.');
        return true;

    } catch (error) {
        console.error('Erro ao validar mensagens:', error);
        return false;
    }
}

// Função para processar mensagem com base no tipo
async function processMessageByType(message, userName, userId) {
    console.log('\n=== Iniciando Processamento de Mensagem ===');
    console.log(`Tipo de mensagem: ${message.type}`);
    console.log(`Usuário: ${userName} (ID: ${userId})`);
    
    try {
        let messageText = message.body;
        let mediaData = null;

        // Verifica se tem mídia
        if (message.hasMedia) {
            console.log('Mídia detectada, iniciando download...');
            const media = await message.downloadMedia();
            if (media) {
                console.log('Download de mídia concluído');
                mediaData = {
                    type: message.type,
                    mimetype: media.mimetype,
                    data: media.data
                };

                console.log('Iniciando interpretação da mídia...');
                const mediaInterpretation = await interpretMedia(mediaData, messageText);
                
                console.log('Combinando interpretação com mensagem original...');
                messageText = `[Interpretação da ${mediaData.type}]: ${mediaInterpretation}\n\nMensagem do usuário: ${messageText}`;
            }
        } else {
            console.log('Mensagem sem mídia, processando apenas texto');
        }

        // Validação das mensagens do usuário
        const isMessageValid = await validateUserMessages([messageText], process.env.SYSTEM_PROMPT);
        if (!isMessageValid) {
            console.log('Mensagem não válida, ignorando...');
            return null;
        }

        console.log('Gerando resposta com contexto completo...');
        const response = await generateResponse(messageText, userName, userId);
        
        console.log('=== Fim do Processamento de Mensagem ===\n');
        return response;

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    }
}

// Função para gerar resposta usando Gemini (modificada)
async function generateResponse(message, userName, userId) {
    console.log('\n=== Iniciando Geração de Resposta ===');
    console.log(`Gerando resposta para: ${userName}`);
    console.log(`Mensagem recebida: ${message.substring(0, 100)}...`);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Obtém ou inicializa o histórico do usuário
        if (!conversationHistory.has(userId)) {
            console.log('Inicializando novo histórico de conversa');
            conversationHistory.set(userId, [
                {
                    role: "user",
                    parts: process.env.SYSTEM_PROMPT,
                },
                {
                    role: "model",
                    parts: "*assistente virtual:* Entendi perfeitamente minhas instruções.",
                },
                {
                    role: "user",
                    parts: `O Nome do Paciente é ${userName}`,
                },
            ]);
        }

        console.log('Iniciando chat com histórico...');
        const chat = model.startChat({
            history: conversationHistory.get(userId),
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
            },
        });

        console.log('Enviando mensagem para o Gemini...');
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const responseText = response.text();
        console.log('Resposta gerada:', responseText.substring(0, 100) + '...');

        console.log('Atualizando histórico de conversa...');
        const updatedHistory = await chat.getHistory();
        conversationHistory.set(userId, updatedHistory);

        // Limita o tamanho do histórico
        if (conversationHistory.get(userId).length > 20) {
            console.log('Limitando tamanho do histórico...');
            const trimmedHistory = [
                ...conversationHistory.get(userId).slice(0, 3),
                ...conversationHistory.get(userId).slice(-17)
            ];
            conversationHistory.set(userId, trimmedHistory);
        }

        console.log('=== Fim da Geração de Resposta ===\n');
        return responseText;

    } catch (error) {
        console.error('Erro ao gerar resposta:', error);
        return "Desculpe, não consegui processar sua mensagem no momento.";
    }
}

// Evento de mensagem
client.on('message', async (message) => {
    console.log('\n=== Nova Mensagem Recebida ===');
    console.log(`De: ${message.from}`);
    console.log(`Tipo: ${message.type}`);
    console.log(`Conteúdo: ${message.body}`);
    
    try {
        const chat = await message.getChat();
        
        if (chat.id.server !== 'c.us' || !isPhoneNumberAllowed(message.from)) {
            console.log('Mensagem ignorada: chat não individual ou número não permitido');
            return;
        }

        if (isUserInCooldown(message.from)) {
            console.log('Usuário em cooldown, mensagem ignorada');
            return;
        }

        const now = Date.now();
        if (now - lastMessageTime < MIN_TIME_BETWEEN_MESSAGES) {
            console.log(`Aguardando ${MIN_TIME_BETWEEN_MESSAGES}ms entre mensagens...`);
            await new Promise(resolve => setTimeout(resolve, MIN_TIME_BETWEEN_MESSAGES));
        }
        lastMessageTime = now;

        if (!userNames.has(message.from)) {
            const contact = await message.getContact();
            const userName = contact.pushname || 'Usuário';
            userNames.set(message.from, userName);
            console.log(`Novo usuário registrado: ${userName}`);
        }

        const userName = userNames.get(message.from);
        console.log('Processando mensagem...');
        const response = await processMessageByType(message, userName, message.from);
        
        // Só envia resposta se ela não for null
        if (response) {
            console.log('Verificando cooldown...');
            const shouldCooldown = handleCooldown(response, message.from);
            
            console.log('Enviando resposta...');
            await client.sendMessage(message.from, response);
            
            if (shouldCooldown) {
                console.log(`Cooldown ativado para usuário ${message.from}`);
            }
        } else {
            console.log('Mensagem ignorada: validação falhou');
        }

        console.log('=== Processamento de Mensagem Concluído ===\n');

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        await client.sendMessage(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem.');
    }
});

// Inicia o cliente
client.initialize();
