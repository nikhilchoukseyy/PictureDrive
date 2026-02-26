const TelegramBot = require('node-telegram-bot-api');
const { registerBotHandlers } = require('./controllers/botController');

function createBot(token, storageChannelId) {
  if (!token) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN in environment variables.');
  }

  if (!storageChannelId) {
    throw new Error('Missing TELEGRAM_STORAGE_CHANNEL_ID in environment variables.');
  }

  const bot = new TelegramBot(token, { polling: true });
  registerBotHandlers(bot, storageChannelId);

  console.log('🤖 Telegram bot is running...');
  return bot;
}

module.exports = { createBot };
