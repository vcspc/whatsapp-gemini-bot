require('dotenv').config();
const WhatsAppBot = require('./src/classes/WhatsAppBot');

async function main() {
    try {
        const bot = new WhatsAppBot();
        console.log('Iniciando o bot...');
        await bot.start();

        // Tratamento de encerramento gracioso
        process.on('SIGINT', async () => {
            console.log('Encerrando o bot...');
            await bot.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Encerrando o bot...');
            await bot.stop();
            process.exit(0);
        });

    } catch (error) {
        console.error('Erro fatal:', error);
        process.exit(1);
    }
}

main();
