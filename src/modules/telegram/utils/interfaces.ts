import { TelegramBot } from 'node-telegram-bot-api';
export interface KeyboardOptions {
  keyboard: TelegramBot.KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}