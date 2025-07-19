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
          await this.sendLanguageSelection(chatId, fullName, true);
          return;
        }

        if (!user.phone) {
          const message = user.language === 'ru'
            ? '📞 Пожалуйста, отправьте ваш номер телефона:'
            : '📞 Iltimos, telefon raqamingizni yuboring:';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getMainKeyboard(true, user.language),
          });
          return;
        }

        const message = user.language === 'ru'
          ? `👋 Добро пожаловать обратно, ${fullName}! 🛍️ Пользуйтесь нашим магазином.`
          : `👋 Qaytganingizdan xursandmiz, ${fullName}! 🛒 Do‘konimizdan bemalol foydalaning!`;
        await this.telegramService.sendMessage(chatId, message, {
          reply_markup: getMainKeyboard(false, user.language),
        });

      } catch (error) {
        await this.telegramService.sendMessage(
          chatId,
          '❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.\n❌ Ошибка произошла, попробуйте позже.',
        );
      }
    });

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text?.toLowerCase() || '';
      const fullName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();

      if (text.includes('tilni o‘zgartirish') || text.includes('изменить язык')) {
        await this.sendLanguageSelection(chatId, fullName, false);
      }
    });

    bot.onText(/\/language/, async (msg) => {
      const chatId = msg.chat.id;
      const fullName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
      await this.sendLanguageSelection(chatId, fullName, false);
    });

    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const telegramId = query.from.id.toString();
      const data = query.data;

      if (data === 'lang_uz' || data === 'lang_ru') {
        const newLang = data === 'lang_uz' ? 'uz' : 'ru';
        await this.userService.updateLanguage(telegramId, newLang);

        const confirmMessage = newLang === 'ru'
          ? '✅ Язык изменён на русский!'
          : '✅ Til o‘zbekchaga o‘zgartirildi!';

        await this.telegramService.sendMessage(chatId, confirmMessage, {
          reply_markup: getMainKeyboard(false, newLang),
        });
      }
    });
  }

  private async sendLanguageSelection(chatId: number, fullName: string, isWelcome: boolean = false) {
    const message = isWelcome
      ? `👋 Xush kelibsiz, ${fullName}!\n\n🌐 Iltimos, tilni tanlang:\n🌐 Пожалуйста, выберите язык:`
      : `🌐 Iltimos, tilni tanlang:\n🌐 Пожалуйста, выберите язык:`;

    await this.telegramService.sendMessage(
      chatId,
      message,
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
  }
}
