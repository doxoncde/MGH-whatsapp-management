import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3001,
  apiToken: process.env.API_TOKEN || 'mgh-dashboard-secret-token-change-me',
  adminWhatsapp: process.env.ADMIN_WHATSAPP || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  phoneAuthToken: process.env.PHONE_AUTH_TOKEN || 'phone-secret-token',
  nodeEnv: process.env.NODE_ENV || 'development',
};
