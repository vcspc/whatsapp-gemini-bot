class UserManager {
    constructor() {
        this.userNames = new Map();
        this.conversationHistory = new Map();
        this.userCooldowns = new Map();
        this.lastMessageTime = 0;
    }

    setUserName(userId, name) {
        this.userNames.set(userId, name);
    }

    getUserName(userId) {
        return this.userNames.get(userId) || 'Usuário';
    }

    addToConversationHistory(userId, message, role = 'user') {
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, []);
        }

        const history = this.conversationHistory.get(userId);
        history.push({
            role: role === 'user' ? 'user' : 'model',
            parts: message
        });

        if (history.length > 20) {
            const trimmedHistory = [
                ...history.slice(0, 3),
                ...history.slice(-17)
            ];
            this.conversationHistory.set(userId, trimmedHistory);
        }
    }

    getConversationHistory(userId) {
        if (!this.conversationHistory.has(userId)) {
            return [];
        }
        return this.conversationHistory.get(userId);
    }

    setCooldown(userId, response, cooldownTriggerMessages) {
        if (!response || typeof response !== 'string') return false;

        const shouldTriggerCooldown = cooldownTriggerMessages.some(message => {
            const regex = new RegExp(`\\b${message}\\b`, 'i');
            return regex.test(response);
        });

        if (shouldTriggerCooldown) {
            const cooldownTime = Date.now() + (60 * 60 * 1000); // 1 hora
            this.userCooldowns.set(userId, cooldownTime);
            return true;
        }
        return false;
    }

    isInCooldown(userId) {
        const cooldownTime = this.userCooldowns.get(userId);
        if (!cooldownTime) return false;
        
        if (Date.now() < cooldownTime) {
            return true;
        }
        this.userCooldowns.delete(userId);
        return false;
    }

    canSendMessage() {
        const now = Date.now();
        if (now - this.lastMessageTime < 2000) {
            return false;
        }
        this.lastMessageTime = now;
        return true;
    }
}

module.exports = UserManager;
