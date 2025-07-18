import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { UserService } from '../../user/user.service';
import { TelegramService } from '../telegram.service';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class StartHandler {
  private logger = new Logger(StartHandler.name);

  constructor(
    private userService: UserService,
    private telegramService: TelegramService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();

    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      const fullName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();

      this.logger.log(`Processing /start for telegramId: ${telegramId}`);
      const startTime = Date.now();

      try {
        let user = await this.userService.registerUser({ telegramId, fullName });
        const duration = Date.now() - startTime;
        if (!user.language) {
          this.logger.log(`User found but language is missing in ${duration}ms`);
          await this.telegramService.sendMessage(
            chatId,
            `Xush kelibsiz, ${fullName}! Iltimos, tilni tanlang:\nДобро пожаловать, ${fullName}! Пожалуйста, выберите язык:`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '🇺🇿 O‘zbekcha', callback_data: 'lang_uz' },
                    { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
                  ],
                ],
                one_time_keyboard: true,
              },
            },
          );
        } else {
          if (!user.phone) {
            this.logger.log(`User found but phone is missing in ${duration}ms`);
            const message = user.language === 'uz'
              ? `Xush kelibsiz, ${fullName}! Iltimos, telefon raqamingizni yuboring:`
              : `Добро пожаловать, ${fullName}! Пожалуйста, отправьте ваш номер телефона:`;
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(true, user.language),
            });
          } else {
            this.logger.log(`Existing user with phone in ${duration}ms`);
            const message = user.language === 'uz'
              ? `Qaytganingizdan xursandmiz, ${fullName}! 🛒 Do‘konimizdan bemalol foydalaning!`
              : `Рады вашему возвращению, ${fullName}! 🛒 Пользуйтесь нашим магазином!`;
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(false, user.language),
            });
          }
        }
      } catch (error) {
        this.logger.error(`Error in /start: ${error.message}`);
        await this.telegramService.sendMessage(
          chatId,
          'Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.\nОшибка произошла, попробуйте позже.',
        );
      }
    });
  }
}