class Config {
    constructor() {
        this.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        this.SYSTEM_PROMPT = process.env.SYSTEM_PROMPT;
        this.GEMINI_TEMPERATURE = parseFloat(process.env.GEMINI_TEMPERATURE) || 0.4;
        this.PHONE_FILTER_MODE = process.env.PHONE_FILTER_MODE || 'allowed';
        this.ALLOWED_PHONE_NUMBERS = (process.env.ALLOWED_PHONE_NUMBERS || '').split(',').filter(Boolean);
        this.BLOCKED_PHONE_NUMBERS = (process.env.BLOCKED_PHONE_NUMBERS || '').split(',').filter(Boolean);
        this.COOLDOWN_TRIGGER_MESSAGES = process.env.COOLDOWN_TRIGGER_MESSAGES 
            ? JSON.parse(process.env.COOLDOWN_TRIGGER_MESSAGES)
            : ["*assistente virtual:* Vou repassar para o doutor Vinícius"];
        this.MIN_TIME_BETWEEN_MESSAGES = 2000;
    }

    isPhoneNumberAllowed(phoneNumber) {
        if (!phoneNumber.endsWith('@c.us')) {
            return false;
        }

        if (this.PHONE_FILTER_MODE === 'allowed') {
            return this.ALLOWED_PHONE_NUMBERS.length === 0 || this.ALLOWED_PHONE_NUMBERS.includes(phoneNumber);
        }
        return !this.BLOCKED_PHONE_NUMBERS.includes(phoneNumber);
    }
}

module.exports = Config; 