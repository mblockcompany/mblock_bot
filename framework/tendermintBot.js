import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const telegramToken = process.env.token;

const bot = new TelegramBot(telegramToken, {polling: true});

export {bot};

export function sendMessage(chatId, string) {
    if(chatId != null)
        bot.sendMessage(chatId, messageFilter(string), {"parse_mode" : "Markdown"});
}

export function sendErrorMsg(chatId) {
    sendMessage(chatId, "Bot Error 발생 Log 확인");
}

function messageFilter(str) {
    return str.replaceAll("_", "-");
}

export function sendMessageAllChat(message, authenticationDict) {
    Object.keys(authenticationDict).forEach(chatId => {
        if(authenticationDict[chatId])
            sendMessage(chatId, message)
    });
}