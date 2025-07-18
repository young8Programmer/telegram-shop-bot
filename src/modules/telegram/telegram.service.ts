import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { OrderService } from '../order/order.service';
import { DeliveryService } from '../delivery/delivery.service';
import { formatOrderList, formatUserList, formatProductList, formatCategoryList, formatFeedbackList } from './utils/helpers';
import { getMainKeyboard } from './utils/keyboards';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private logger = new Logger(TelegramService.name);
  private readonly adminTelegramUser = 'Vali_003';

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    @Inject(forwardRef(() => OrderService)) private readonly orderService: OrderService,
    private deliveryService: DeliveryService,
  ) {
    const token = '7942071036:AAFz_o_p2p2o-Gq-1C1YZMQSdODCHJiu2dY';
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not defined in .env file');
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    this.bot = new TelegramBot(token, { polling: false });
    this.setupWebhook();
    this.setupCommands();
  }

  private async setupWebhook() {
    try {
      const webhookUrl = 'https://telegram-shop-bot-production.up.railway.app/telegram/webhook';
      if (!webhookUrl) {
        this.logger.error('WEBHOOK_URL is not defined in .env file');
        throw new Error('WEBHOOK_URL is not defined');
      }
      this.logger.log(`Setting webhook to ${webhookUrl}`);
      const startTime = Date.now();
      await this.bot.setWebHook(webhookUrl);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook set in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      throw error;
    }
  }

  private setupCommands() {
  this.bot.onText(/👤 Profilim|👤 Мой профиль/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    try {
      const user = await this.userService.findByTelegramId(telegramId);
      const language = user.language || 'uz';
      const message = `${language === 'uz' ? '👤 Profilim' : '👤 Мой профиль'}\n${language === 'uz' ? 'Ism' : 'Имя'}: ${user.fullName}\n${language === 'uz' ? 'Telefon' : 'Телефон'}: ${user.phone || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}\nTelegram ID: ${user.telegramId}`;
      await this.bot.sendMessage(chatId, message, {
        reply_markup: getMainKeyboard(!user.phone, language),
      });
    } catch (error) {
      this.logger.error(`Error in profile: ${error.message}`);
      const language = (await this.userService.findByTelegramId(telegramId))?.language || 'uz';
      await this.bot.sendMessage(chatId, language === 'uz' ? 'Profil ma‘lumotlarini olishda xato yuz berdi.' : 'Ошибка при получении данных профиля.');
    }
  });

  this.bot.onText(/🕘 Buyurtma tarixi|🕘 История заказов/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    try {
      const user = await this.userService.findByTelegramId(telegramId);
      const language = user.language || 'uz';
      const orders = await this.orderService.getUserOrders(telegramId);
      const message = orders.length ? formatOrderList(orders, language) : (language === 'uz' ? 'Buyurtmalar mavjud emas.' : 'Заказы отсутствуют.');
      await this.bot.sendMessage(chatId, `${language === 'uz' ? '🕘 Buyurtma tarixi' : '🕘 История заказов'}\n${message}`, {
        reply_markup: getMainKeyboard(false, language),
      });
    } catch (error) {
      this.logger.error(`Error in order history: ${error.message}`);
      const language = (await this.userService.findByTelegramId(telegramId))?.language || 'uz';
      await this.bot.sendMessage(chatId, language === 'uz' ? 'Buyurtma tarixini olishda xato yuz berdi.' : 'Ошибка при получении истории заказов.');
    }
  });

  this.bot.onText(/ℹ️ Biz haqimizda|ℹ️ О нас/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const user = await this.userService.findByTelegramId(msg.from.id.toString());
      const language = user.language || 'uz';
      const message = `${language === 'uz' ? 'ℹ️ Biz haqimizda' : 'ℹ️ О нас'}\n${language === 'uz' ? 'Biz onlayn do‘konmiz, sifatli mahsulotlar va tezkor xizmat taklif qilamiz!' : 'Мы онлайн-магазин, предлагаем качественные товары и быструю доставку!'}\n${language === 'uz' ? 'Aloqa' : 'Контакты'}: @${this.adminTelegramUser}\n${language === 'uz' ? 'Veb-sayt' : 'Веб-сайт'}: https://yourshop.uz`;
      await this.bot.sendMessage(chatId, message, {
        reply_markup: getMainKeyboard(false, language),
      });
    } catch (error) {
      this.logger.error(`Error in about: ${error.message}`);
      const language = (await this.userService.findByTelegramId(msg.from.id.toString()))?.language || 'uz';
      await this.bot.sendMessage(chatId, language === 'uz' ? 'Biz haqimizda ma‘lumot olishda xato yuz berdi.' : 'Ошибка при получении информации о нас.');
    }
  });
}
  getBotInstance(): TelegramBot {
    return this.bot;
  }

  async handleWebhookUpdate(update: TelegramBot.Update) {
    try {
      const startTime = Date.now();
      await this.bot.processUpdate(update);
      const duration = Date.now() - startTime;
      this.logger.log(`Webhook update processed in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Webhook update failed: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(chatId: any, text: string, options: TelegramBot.SendMessageOptions = {}) {
  try {
    await this.bot.sendMessage(chatId, text, {
      ...options,
      parse_mode: options.parse_mode ?? 'HTML',
    });
  } catch (error) {
    this.logger.error(`Error sending message to chatId ${chatId}: ${error.message}`);
    throw error;
  }
}


  async sendPhoto(chatId: number, photo: string, options?: TelegramBot.SendPhotoOptions) {
    try {
      await this.bot.sendPhoto(chatId, photo, { ...options, parse_mode: options?.parse_mode || 'HTML' });
    } catch (error) {
      this.logger.error(`Error sending photo to chatId ${chatId}: ${error.message}`);
      throw error;
    }
  }

  async sendChatAction(chatId: string | number, action: TelegramBot.ChatAction) {
    try {
      await this.bot.sendChatAction(chatId, action);
    } catch (error) {
      this.logger.error(`Error sending chat action to chatId ${chatId}: ${error.message}`);
      throw error;
    }
  }
}