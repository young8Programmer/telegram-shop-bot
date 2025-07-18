import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { UserService } from '../../user/user.service';
import { TelegramService } from '../telegram.service';
import { getAdminKeyboard } from '../utils/keyboards';

@Injectable()
export class AdminHandler {
  private logger = new Logger(AdminHandler.name);

  constructor(
    private userService: UserService,
    private telegramService: TelegramService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    bot.onText(/\/admin/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        if (!user.isAdmin) {
          const message = language === 'uz'
            ? '❌ Bu amal faqat adminlar uchun mavjud.'
            : '❌ Это действие доступно только администраторам.';
          await this.telegramService.sendMessage(chatId, message, {});
          return;
        }
        const message = language === 'uz'
          ? '🛠 Admin paneliga xush kelibsiz!'
          : '🛠 Добро пожаловать в админ-панель!';
        await this.telegramService.sendMessage(chatId, message, {
          reply_markup: getAdminKeyboard(language),
        });
      } catch (error) {
        this.logger.error(`Error in admin: ${error.message}`);
        const message = '❌ Admin paneliga kirishda xato yuz berdi.\n❌ Ошибка при входе в админ-панель.';
        await this.telegramService.sendMessage(chatId, message, {});
      }
    });
  }
}