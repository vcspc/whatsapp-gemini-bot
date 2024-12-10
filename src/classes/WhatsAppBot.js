const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Config = require('../config/Config');
const UserManager = require('./UserManager');
const GeminiAI = require('./GeminiAI');
const MessageHandler = require('./MessageHandler');

class WhatsAppBot {
    constructor() {
        this.config = new Config();
        this.userManager = new UserManager();
        this.geminiAI = new GeminiAI(this.config.GEMINI_API_KEY, this.config.GEMINI_TEMPERATURE);
        this.messageHandler = new MessageHandler(this.geminiAI, this.userManager, this.config);
        
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox']
            }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Evento de QR Code
        this.client.on('qr', (qr) => {
            console.log('QR Code gerado! Escaneie-o com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        // Evento de cliente pronto
        this.client.on('ready', () => {
            console.log('Cliente WhatsApp está pronto!');
        });

        // Evento de mensagem recebida
        this.client.on('message', async (message) => {
            try {
                // Verifica se o número está permitido
                if (!this.config.isPhoneNumberAllowed(message.from)) {
                    console.log(`Número não permitido: ${message.from}`);
                    return;
                }

                // Processa a mensagem
                const response = await this.messageHandler.processMessage(message);
                
                if (response) {
                    await message.reply(response);
                }
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
            }
        });

        // Evento de contato carregado
        this.client.on('contact_changed', async (contact) => {
            const userId = contact.id._serialized;
            const userName = contact.name || contact.pushname || 'Usuário';
            this.userManager.setUserName(userId, userName);
        });
    }

    async start() {
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('Erro ao inicializar o bot:', error);
            throw error;
        }
    }

    async stop() {
        try {
            await this.client.destroy();
        } catch (error) {
            console.error('Erro ao desligar o bot:', error);
            throw error;
        }
    }
}

module.exports = WhatsAppBot; 