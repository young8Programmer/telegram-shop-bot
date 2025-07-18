import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { OrderService } from '../order/order.service';
import { DeliveryService } from '../delivery/delivery.service';
import { formatOrderList, formatUserList, formatProductList, formatCategoryList, formatFeedbackList } from './utils/helpers';
import { getMainKeyboard, getAdminKeyboard } from './utils/keyboards';

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
    this.bot.onText(/\/admin/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        if (!user.isAdmin) {
          const message = language === 'uz'
            ? '❌ Bu amal faqat adminlar uchun mavjud.'
            : '❌ Это действие доступно только администраторам.';
          await this.bot.sendMessage(chatId, message);
          return;
        }
        const message = language === 'uz'
          ? '👨‍💻 Admin paneliga xush kelibsiz!'
          : '👨‍💻 Добро пожаловать в панель администратора!';
        await this.bot.sendMessage(chatId, message, {
          reply_markup: getAdminKeyboard(language),
        });
      } catch (error) {
        this.logger.error(`Error in admin command: ${error.message}`);
        const message = '❌ Произошла ошибка при доступе к админ-панели. Пожалуйста, попробуйте позже.';
        await this.bot.sendMessage(chatId, message);
      }
    });

    this.bot.onText(/👤 (Profilim|Мой профиль)/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const message = language === 'uz'
          ? `👤 Profilim\nIsm: ${user.fullName}\nTelefon: ${user.phone || 'Kiritilmagan'}\nTelegram ID: ${user.telegramId}`
          : `👤 Мой профиль\nИмя: ${user.fullName}\nТелефон: ${user.phone || 'Не указан'}\nTelegram ID: ${user.telegramId}`;
        await this.bot.sendMessage(chatId, message, {
          reply_markup: getMainKeyboard(!user.phone, language),
        });
      } catch (error) {
        this.logger.error(`Error in profile: ${error.message}`);
        await this.bot.sendMessage(chatId, '❌ Произошла ошибка при получении профиля. Пожалуйста, попробуйте позже.');
      }
    });

    this.bot.onText(/🕘 (Buyurtma tarixi|История заказов)/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const orders = await this.orderService.getUserOrders(telegramId);
        const message = orders.length
          ? formatOrderList(orders, language)
          : language === 'uz'
            ? 'Buyurtmalar mavjud emas.'
            : 'Заказы отсутствуют.';
        await this.bot.sendMessage(chatId, language === 'uz' ? `🕘 Buyurtma tarixi\n${message}` : `🕘 История заказов\n${message}`, {
          reply_markup: getMainKeyboard(!user.phone, language),
          parse_mode: 'HTML',
        });
      } catch (error) {
        this.logger.error(`Error in order history: ${error.message}`);
        await this.bot.sendMessage(chatId, '❌ Произошла ошибка при получении истории заказов. Пожалуйста, попробуйте позже.');
      }
    });

    this.bot.onText(/ℹ️ (Biz haqimizda|О нас)/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const message = language === 'uz'
          ? `ℹ️ Biz haqimizda\nBiz onlayn do‘konmiz, sifatli mahsulotlar va tezkor xizmat taklif qilamiz!\nAloqa: @${this.adminTelegramUser}\nVeb-sayt: https://yourshop.uz`
          : `ℹ️ О нас\nМы онлайн-магазин, предлагаем качественные товары и быструю доставку!\nКонтакт: @${this.adminTelegramUser}\nВеб-сайт: https://yourshop.uz`;
        await this.bot.sendMessage(chatId, message, {
          reply_markup: getMainKeyboard(!user.phone, language),
        });
      } catch (error) {
        this.logger.error(`Error in about: ${error.message}`);
        await this.bot.sendMessage(chatId, '❌ Произошла ошибка при получении информации. Пожалуйста, попробуйте позже.');
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

  async sendMessage(chatId: any, text: string, options?: TelegramBot.SendMessageOptions) {
    try {
      await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      this.logger.error(`Error sending message to chatId ${chatId}: ${error.message}`);
      throw error;
    }
  }

  async sendPhoto(chatId: number, photo: string, options?: TelegramBot.SendPhotoOptions) {
    try {
      await this.bot.sendPhoto(chatId, photo, options);
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