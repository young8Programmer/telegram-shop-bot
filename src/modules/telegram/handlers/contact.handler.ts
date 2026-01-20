// validation xatolari tuzatildi
import { Injectable, Logger } from '@nestjs/common';
// type error tuzatildi
import * as TelegramBot from 'node-telegram-bot-api';
import { TelegramService } from '../telegram.service';
import { UserService } from '../../user/user.service';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class ContactHandler {
  private logger = new Logger(ContactHandler.name);

  constructor(
    private telegramService: TelegramService,
    private userService: UserService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();

    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();

      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';

        if (!msg.contact || msg.contact.user_id !== msg.from.id) {
          this.logger.warn(`Noto‘g‘ri kontakt: ${JSON.stringify(msg.contact)}`);
          const message = language === 'uz'
            ? 'Faqat o‘zingizning telefon raqamingizni ulashingiz mumkin. Iltimos, "Telefon raqamni yuborish" tugmasini bosing.'
            : 'Вы можете поделиться только своим номером телефона. Пожалуйста, нажмите кнопку "Отправить номер телефона".';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getMainKeyboard(true, language),
          });
          return;
        }

        const phone = msg.contact.phone_number;

        this.logger.log(`Telefon qabul qilindi: ${phone} telegramId: ${telegramId}`);
        await this.userService.updatePhoneNumber(telegramId, phone);

        const message = language === 'uz'
          ? `✅ Telefon raqamingiz saqlandi: ${phone}\nEndi do‘konimizdan bemalol foydalanishingiz mumkin!`
          : `✅ Ваш номер телефона сохранен: ${phone}\nТеперь вы можете свободно пользоваться нашим магазином!`;
        await this.telegramService.sendMessage(chatId, message, {
          reply_markup: getMainKeyboard(false, language),
        });
      } catch (error) {
        this.logger.error(`Telefonni saqlashda xato: ${error.message}`);
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const message = language === 'uz'
          ? '❌ Telefon raqamingizni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.'
          : '❌ Ошибка при сохранении номера телефона. Пожалуйста, попробуйте снова.';
        await this.telegramService.sendMessage(chatId, message);
      }
    });
  }
}