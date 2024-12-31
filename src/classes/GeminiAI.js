const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAI {
    constructor(apiKey, temperature = 0.4) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.temperature = temperature;
    }

    async generateResponse(message, conversationHistory, systemPrompt) {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: this.temperature,
                },
                tools: [{
                    name: 'get_current_time',
                    description: 'Retorna a hora atual no formato HH:MM',
                }]
            });

            const initialHistory = [{
                role: 'model',
                parts: [{ text: systemPrompt }]
            }];

            const chat = model.startChat({
                history: [
                    ...initialHistory,
                    ...conversationHistory.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.parts }]
                    }))
                ]
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Erro ao gerar resposta:', error);
            throw error;
        }
    }

    async validateUserMessages(messages, systemPrompt) {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 segundo

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const model = this.genAI.getGenerativeModel({ 
                    model: "gemini-1.5-flash-8b",
                    generationConfig: {
                        temperature: 0.1
                    }
                });

                for (let i = 0; i < Math.min(3, messages.length); i++) {
                    const message = messages[i];
                    const prompt = `Verifique se a seguinte mensagem está alinhada com o objetivo do chatbot: "${systemPrompt}". Mensagem: "${message}". Se não está alinhada, responda com "não". Se está alinhada, responda com "sim".`;
                    
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const analysis = response.text();

                    if (!analysis.toLowerCase().includes("sim")) {
                        return false;
                    }
                }
                return true;
            } catch (error) {
                if (error.message.includes('503') && attempt < maxRetries - 1) {
                    console.log(`Tentativa ${attempt + 1} falhou, tentando novamente em ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
                console.error('Erro ao validar mensagens:', error);
                return false;
            }
        }
        return false;
    }

    async interpretMedia(mediaData, messageText = '') {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                generationConfig: {
                    temperature: this.temperature
                }
            });
            
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

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: mediaData.mimetype,
                        data: mediaData.data
                    }
                }
            ]);

            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Erro ao interpretar mídia:', error);
            throw error;
        }
    }

    getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}

module.exports = GeminiAI;
