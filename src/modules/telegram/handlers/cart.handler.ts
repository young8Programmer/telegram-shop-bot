import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CartService } from '../../cart/cart.service';
import { TelegramService } from '../telegram.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class CartHandler {
  private logger = new Logger(CartHandler.name);

  constructor(
    private cartService: CartService,
    private telegramService: TelegramService,
    private userService: UserService,
  ) {}
  handle() {
    const bot = this.telegramService.getBotInstance();
    bot.onText(/🛒 (Savatcha|Корзина)/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from.id.toString();
      try {
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        this.logger.log(`Processing cart for telegramId: ${telegramId}`);
        const startTime = Date.now();
        const cartItems = await this.cartService.getCartItems(telegramId);
        const duration = Date.now() - startTime;
        this.logger.log(`Fetched ${cartItems.length} cart items in ${duration}ms`);
        if (!cartItems.length) {
          const message = language === 'uz' ? 'Savatchangiz bo‘sh.' : 'Ваша корзина пуста.';
          await this.telegramService.sendMessage(chatId, message);
          return;
        }
        let message = language === 'uz' ? 'Savatchangiz:\n' : 'Ваша корзина:\n';
        let total = 0;
        cartItems.forEach((item) => {
          const itemText = language === 'uz'
            ? `${item.product.name} - ${item.quantity} dona, Narxi: ${item.product.price * item.quantity} so‘m\n`
            : `${item.product.name} - ${item.quantity} шт., Цена: ${item.product.price * item.quantity} сум\n`;
          message += itemText;
          total += item.product.price * item.quantity;
        });
        message += language === 'uz' ? `Jami: ${total} so‘m` : `Итого: ${total} сум`;
        await this.telegramService.sendMessage(chatId, message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: language === 'uz' ? '✅ Buyurtma berish' : '✅ Оформить заказ', callback_data: 'place_order' }],
              [{ text: language === 'uz' ? '🗑️ Savatchani tozalash' : '🗑️ Очистить корзину', callback_data: 'clear_cart' }],
            ],
          },
        });
      } catch (error) {
        this.logger.error(`Error in cart: ${error.message}`);
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user.language || 'uz';
        const message = language === 'uz' ? 'Savatchani olishda xato yuz berdi.' : 'Ошибка при получении корзины.';
        await this.telegramService.sendMessage(chatId, message);
      }
    });
  }
}