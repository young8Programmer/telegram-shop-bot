import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class HelpHandler {
  private logger = new Logger(HelpHandler.name);

  constructor(
    private telegramService: TelegramService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    const adminTelegramId = "5661241603";
    const adminTelegramUser = "Vali_003";

    if (!adminTelegramId || !adminTelegramUser) {
      this.logger.error('ADMIN_TELEGRAM_ID or ADMIN_TELEGRAM_USER is not defined in .env file');
      throw new Error('ADMIN_TELEGRAM_ID or ADMIN_TELEGRAM_USER is not defined');
    }

    bot.onText(/🆘 (Yordam|Помощь)/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        this.logger.log(`Processing help for telegramId: ${telegramId}`);
        const message = language === 'uz'
          ? `🆘 Yordam\nSavollaringiz bo‘lsa, admin bilan bog‘laning: @${adminTelegramUser}\nYoki xabar yozing:`
          : `🆘 Помощь\nЕсли у вас есть вопросы, свяжитесь с администратором: @${adminTelegramUser}\nИли напишите сообщение:`;
        await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
        bot.once('message', async (replyMsg) => {
          const replyText = replyMsg.text;
          if (!replyText) {
            this.logger.log(`Ignoring empty help message from telegramId: ${telegramId}`);
            const emptyMessage = language === 'uz' ? 'Iltimos, xabar yozing.' : 'Пожалуйста, напишите сообщение.';
            await this.telegramService.sendMessage(chatId, emptyMessage);
            return;
          }
          try {
            await this.telegramService.sendChatAction(adminTelegramId, 'typing');
            const adminMessage = language === 'uz'
              ? `Yordam so‘rovi:\nFoydalanuvchi: ${replyMsg.from.id} (@${replyMsg.from.username || 'N/A'})\nXabar: ${replyText}`
              : `Запрос на помощь:\nПользователь: ${replyMsg.from.id} (@${replyMsg.from.username || 'N/A'})\nСообщение: ${replyText}`;
            await this.telegramService.sendMessage(adminTelegramId, adminMessage);
            const successMessage = language === 'uz'
              ? `Sizning xabaringiz adminga (@${adminTelegramUser}) yuborildi. Tez orada javob olasiz!`
              : `Ваше сообщение отправлено администратору (@${adminTelegramUser}). Скоро вы получите ответ!`;
            await this.telegramService.sendMessage(chatId, successMessage);
          } catch (error) {
            this.logger.error(`Error sending help to admin: ${error.message}`);
            const errorMessage = language === 'uz'
              ? error.response?.body?.error_code === 403
                ? `Xabar yuborishda xato: Admin (@${adminTelegramUser}) bot bilan chat boshlamagan. Iltimos, @${adminTelegramUser} ga yozing.`
                : `Xabar yuborishda xato: ${error.message}. Iltimos, @${adminTelegramUser} ga yozing.`
              : error.response?.body?.error_code === 403
                ? `Ошибка отправки: Админ (@${adminTelegramUser}) не начал чат с ботом. Пожалуйста, напишите @${adminTelegramUser}.`
                : `Ошибка отправки: ${error.message}. Пожалуйста, напишите @${adminTelegramUser}.`;
            await this.telegramService.sendMessage(chatId, errorMessage);
          }
        });
      } catch (error) {
        this.logger.error(`Error in help: ${error.message}`);
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const message = language === 'uz'
          ? `Yordam so‘rovida xato yuz berdi. Iltimos, @${adminTelegramUser} ga yozing.`
          : `Ошибка при запросе помощи. Пожалуйста, напишите @${adminTelegramUser}.`;
        await this.telegramService.sendMessage(chatId, message);
      }
    });
  }
}