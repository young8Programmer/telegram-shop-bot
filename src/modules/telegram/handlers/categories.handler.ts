// unit testlar qo'shildi
import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CategoryService } from '../../category/category.service';
import { TelegramService } from '../telegram.service';
import { UserService } from '../../user/user.service';

// changelog yangilandi
@Injectable()
export class CategoriesHandler {
  private logger = new Logger(CategoriesHandler.name);

  constructor(
    private categoryService: CategoryService,
    private telegramService: TelegramService,
    private userService: UserService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    bot.onText(/📁 (Kategoriyalar|Категории)/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        this.logger.log(`Processing categories for telegramId: ${telegramId}`);
        const startTime = Date.now();
        const categories = await this.categoryService.findAll();
        const duration = Date.now() - startTime;
        this.logger.log(`Fetched ${categories.length} categories in ${duration}ms`);
        const keyboard = categories.map((cat) => [
       { text: language === 'uz' ? cat.name : cat.nameRu || cat.name, callback_data: `category_${cat.id}` },]);
        const message = language === 'uz' ? 'Kategoriyalarni tanlang:' : 'Выберите категорию:';
        await this.telegramService.sendMessage(chatId, message, {
          reply_markup: { inline_keyboard: keyboard },
        });
      } catch (error) {
        this.logger.error(`Error in categories: ${error.message}`);
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const message = language === 'uz' ? 'Kategoriyalarni olishda xato yuz berdi.' : 'Ошибка при получении категорий.';
        await this.telegramService.sendMessage(chatId, message);
      }
    });
  }
}