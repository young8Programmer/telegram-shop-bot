import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { TelegramService } from '../telegram.service';
import { getAdminKeyboard } from '../utils/keyboards';

@Injectable()
export class AdminHandler {
  private logger = new Logger(AdminHandler.name);

  constructor(
    private telegramService: TelegramService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    const adminTelegramId = '5661241603';

    bot.onText(/\/admin/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();

      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';

        if (telegramId !== adminTelegramId) {
          const message = language === 'uz'
            ? '❌ Sizda admin huquqlari yo‘q.'
            : '❌ У вас нет прав администратора.';
          await this.telegramService.sendMessage(chatId, message);
          return;
        }

        this.logger.log(`Processing admin panel for telegramId: ${telegramId}`);
        const message = language === 'uz'
          ? '👨‍💼 Admin paneli:'
          : '👨‍💼 Панель администратора:';
        await this.telegramService.sendMessage(chatId, message, {
          reply_markup: getAdminKeyboard(language),
        });
      } catch (error) {
        this.logger.error(`Error in admin panel: ${error.message}`);
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const message = language === 'uz'
          ? 'Admin panelini ochishda xato yuz berdi.'
          : 'Ошибка при открытии панели администратора.';
        await this.telegramService.sendMessage(chatId, message);
      }
    });
  }
}