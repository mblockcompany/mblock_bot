import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const telegramToken = process.env.token;

const bot = new TelegramBot(telegramToken, {polling: true});

export {bot};