const Logger = require('./Logger');

class MessageHandler {
    constructor(geminiAI, userManager, config) {
        this.geminiAI = geminiAI;
        this.userManager = userManager;
        this.config = config;
        this.logger = new Logger();
    }

    async processMessage(message) {
        const userId = message.from;
        const userName = this.userManager.getUserName(userId);
        const isGroup = !userId.endsWith('@c.us');

        // Log da mensagem recebida (sempre registra, independente de autorização)
        await this.logger.logIncomingMessage(userName, userId, message.body);

        // Verifica se é mensagem de grupo
        if (isGroup) {
            const blockMessage = 'Acesso negado: mensagens de grupo não são permitidas';
            await this.logger.logProcessingStep(userName, userId, 'ACESSO NEGADO', blockMessage);
            await this.logger.logOutgoingMessage(userName, userId, blockMessage);
            return null;
        }

        // Verifica autorização do número
        const isAuthorized = this.config.isPhoneNumberAllowed(userId);
        await this.logger.logAuthorizationAttempt(userName, userId, isAuthorized);
        
        if (!isAuthorized) {
            const blockMessage = 'Acesso negado: número não autorizado';
            await this.logger.logProcessingStep(userName, userId, 'ACESSO NEGADO', blockMessage);
            await this.logger.logOutgoingMessage(userName, userId, blockMessage);
            return null;
        }

        // Verifica cooldown
        if (this.userManager.isInCooldown(userId)) {
            const cooldownMessage = 'Usuário em período de cooldown';
            await this.logger.logCooldown(userName, userId, cooldownMessage);
            await this.logger.logOutgoingMessage(userName, userId, cooldownMessage);
            return null;
        }

        // Verifica se pode enviar mensagem (rate limit)
        if (!this.userManager.canSendMessage()) {
            const rateLimitMessage = 'Limite de taxa de mensagens atingido';
            await this.logger.logProcessingStep(userName, userId, 'RATE LIMIT', rateLimitMessage);
            await this.logger.logOutgoingMessage(userName, userId, rateLimitMessage);
            return null;
        }

        try {
            let messageText = message.body;
            let mediaData = null;

            // Processa mídia se houver
            if (message.hasMedia) {
                await this.logger.logProcessingStep(userName, userId, 'MÍDIA', 'Processando mídia');
                const media = await message.downloadMedia();
                if (media) {
                    mediaData = {
                        type: message.type,
                        mimetype: media.mimetype,
                        data: media.data
                    };

                    const mediaInterpretation = await this.geminiAI.interpretMedia(mediaData, messageText);
                    messageText = `[Interpretação da ${mediaData.type}]: ${mediaInterpretation}\n\nMensagem do usuário: ${messageText}`;
                    await this.logger.logProcessingStep(userName, userId, 'MÍDIA', 'Mídia processada com sucesso');
                }
            }

            // Valida mensagem
            await this.logger.logProcessingStep(userName, userId, 'VALIDAÇÃO', 'Iniciando validação da mensagem');
            const isMessageValid = await this.geminiAI.validateUserMessages(
                [messageText],
                this.config.SYSTEM_PROMPT
            );
            await this.logger.logMessageValidation(userName, userId, isMessageValid);

            if (!isMessageValid) {
                const invalidMessage = 'Mensagem inválida para o contexto';
                await this.logger.logOutgoingMessage(userName, userId, invalidMessage);
                return null;
            }

            // Obtém histórico da conversa
            await this.logger.logProcessingStep(userName, userId, 'HISTÓRICO', 'Recuperando histórico da conversa');
            const conversationHistory = this.userManager.getConversationHistory(userId);

            // Gera resposta
            await this.logger.logProcessingStep(userName, userId, 'IA', 'Gerando resposta');
            const response = await this.geminiAI.generateResponse(
                messageText, 
                conversationHistory,
                this.config.SYSTEM_PROMPT
            );

            // Atualiza histórico
            this.userManager.addToConversationHistory(userId, messageText, 'user');
            this.userManager.addToConversationHistory(userId, response, 'assistant');

            // Verifica se deve ativar cooldown
            const cooldownActivated = this.userManager.setCooldown(userId, messageText, this.config.COOLDOWN_TRIGGER_MESSAGES);
             if (cooldownActivated) {
                await this.logger.logCooldown(userName, userId, 'Cooldown ativado');
            }

            // Log da mensagem enviada
            await this.logger.logOutgoingMessage(userName, userId, response);

            return response;

        } catch (error) {
            const errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem.';
            await this.logger.logError(userName, userId, error);
            await this.logger.logOutgoingMessage(userName, userId, errorMessage);
            return errorMessage;
        }
    }
}

module.exports = MessageHandler;
