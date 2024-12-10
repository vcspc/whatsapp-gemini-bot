const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFilePath = 'logs/whatsapp-bot.log') {
        this.logFilePath = logFilePath;
        this.ensureLogDirectoryExists();
    }

    ensureLogDirectoryExists() {
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    formatLogMessage(type, userName, userId, message) {
        const date = new Date();
        date.setHours(date.getHours() - 3);
        
        const timestamp = date.toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        return `[${timestamp}] [${type}] [User: ${userName} (${userId})] ${message}\n`;
    }

    async log(type, userName, userId, message) {
        try {
            const logMessage = this.formatLogMessage(type, userName, userId, message);
            await fs.promises.appendFile(this.logFilePath, logMessage, 'utf8');
        } catch (error) {
            console.error('Erro ao registrar log:', error);
        }
    }

    async logAuthorizationAttempt(userName, userId, isAuthorized) {
        const status = isAuthorized ? 'AUTORIZADO' : 'NÃO AUTORIZADO';
        await this.log('AUTORIZAÇÃO', userName, userId, `Tentativa de acesso: ${status}`);
    }

    async logIncomingMessage(userName, userId, message) {
        await this.log('MENSAGEM RECEBIDA', userName, userId, `Conteúdo: ${message}`);
    }

    async logMessageValidation(userName, userId, isValid) {
        const status = isValid ? 'VÁLIDA' : 'INVÁLIDA';
        await this.log('VALIDAÇÃO', userName, userId, `Mensagem ${status}`);
    }

    async logProcessingStep(userName, userId, step, details) {
        await this.log('PROCESSAMENTO', userName, userId, `${step}: ${details}`);
    }

    async logOutgoingMessage(userName, userId, message) {
        await this.log('MENSAGEM ENVIADA', userName, userId, `Conteúdo: ${message}`);
    }

    async logError(userName, userId, error) {
        await this.log('ERRO', userName, userId, `Erro: ${error.message}`);
    }

    async logCooldown(userName, userId, status) {
        await this.log('COOLDOWN', userName, userId, status);
    }
}

module.exports = Logger; 