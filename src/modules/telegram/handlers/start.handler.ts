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

      let user = await this.userService.registerUser({ telegramId, fullName });

      if (!user.language) {
        await this.sendLanguageSelection(chatId, fullName, true);
        return;
      }

      if (!user.phone) {
        const message = user.language === 'ru'
          ? '📞 Пожалуйста, отправьте ваш номер телефона:'
          : '📞 Iltimos, telefon raqamingizni yuboring:';
        await this.telegramService.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          reply_markup: getMainKeyboard(true, user.language),
        });
        return;
      }

      const message = user.language === 'ru'
        ? `👋 Добро пожаловать обратно, ${fullName}! 🛍️ Пользуйтесь нашим магазином.`
        : `👋 Qaytganingizdan xursandmiz, ${fullName}! 🛒 Do‘konimizdan bemalol foydalaning!`;
      await this.telegramService.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: getMainKeyboard(false, user.language),
      });
    });

    bot.onText(/\/language|tilni o‘zgartirish|изменить язык/i, async (msg) => {
      const chatId = msg.chat.id;
      const fullName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
      await this.sendLanguageSelection(chatId, fullName, false);
    });

    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const telegramId = query.from.id.toString();
      const data = query.data;

      if (data !== 'lang_uz' && data !== 'lang_ru') {
        await bot.answerCallbackQuery(query.id);
        return;
      }

      const newLang = data === 'lang_uz' ? 'uz' : 'ru';
      let user = await this.userService.findByTelegramId(telegramId);

      if (user.language === newLang) {
        const message = newLang === 'ru'
          ? '✅ Язык уже установлен на русский!'
          : '✅ Til allaqachon o‘zbek tilida!';
        await this.telegramService.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          reply_markup: getMainKeyboard(!!user.phone, newLang),
        });
        await bot.answerCallbackQuery(query.id);
        return;
      }

      await this.userService.updateLanguage(telegramId, newLang);
      user = await this.userService.findByTelegramId(telegramId); // Yangi ma'lumotlarni olish

      const confirmMessage = newLang === 'ru'
        ? '✅ Язык изменён на русский!'
        : '✅ Til o‘zbekchaga o‘zgartirildi!';
      await this.telegramService.sendMessage(chatId, confirmMessage, {
        parse_mode: 'HTML',
        reply_markup: getMainKeyboard(!!user.phone, newLang),
      });

      if (!user.phone) {
        const phoneMessage = newLang === 'ru'
          ? '📞 Пожалуйста, отправьте ваш номер телефона:'
          : '📞 Iltimos, telefon raqamingizni yuboring:';
        await this.telegramService.sendMessage(chatId, phoneMessage, {
          parse_mode: 'HTML',
          reply_markup: getMainKeyboard(true, newLang),
        });
      }

      await bot.answerCallbackQuery(query.id);
    });
  }

  private async sendLanguageSelection(chatId: number, fullName: string, isWelcome: boolean = false) {
    const message = isWelcome
      ? `👋 Xush kelibsiz, ${fullName}!\n\n🌐 Iltimos, tilni tanlang:\n🌐 Пожалуйста, выберите язык:`
      : `🌐 Iltimos, tilni tanlang:\n🌐 Пожалуйста, выберите язык:`;

    await this.telegramService.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇺🇿 O‘zbekcha', callback_data: 'lang_uz' },
            { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
          ],
        ],
        one_time_keyboard: true,
      },
    });
  }
}