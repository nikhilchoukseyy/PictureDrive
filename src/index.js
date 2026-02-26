require('dotenv').config();
const express = require('express');
const { connectDatabase } = require('./database');
const { createBot } = require('./bot');


async function bootstrap() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'PictureDrive bot backend' });
  });

  app.get('/', (req, res) => {
    res.send('PictureDrive Bot is running! 🚀');
  });


  const port = process.env.PORT || 3000;
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('Missing MONGO_URI in environment variables.');
  }

  await connectDatabase(mongoUri);
  createBot(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_STORAGE_CHANNEL_ID);

  app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Fatal startup error:', error.message);
  process.exit(1);
});
