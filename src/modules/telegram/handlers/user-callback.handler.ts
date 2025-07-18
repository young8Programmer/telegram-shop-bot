import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CartService } from '../../cart/cart.service';
import { OrderService } from '../../order/order.service';
import { FeedbackService } from '../../feedback/feedback.service';
import { PaymentService } from '../../payment/payment.service';
import { UserService } from '../../user/user.service';
import { DeliveryService } from '../../delivery/delivery.service';
import { ProductService } from '../../product/product.service';
import { TelegramService } from '../telegram.service';
import { formatProductMessage } from '../utils/helpers';
import { PAYMENT_TYPE, ORDER_STATUS } from '../../../common/constants';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class UserCallbackHandler {
  private logger = new Logger(UserCallbackHandler.name);

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService,
    private feedbackService: FeedbackService,
    private paymentService: PaymentService,
    private userService: UserService,
    private deliveryService: DeliveryService,
    private telegramService: TelegramService,
  ) {}

  handle() {
    const bot = this.telegramService.getBotInstance();
    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const telegramId = query.from.id.toString();
      const data = query.data;
      let language = 'uz'; // Standart til
      try {
        this.logger.log(`Processing user callback: ${data} for telegramId: ${telegramId}`);
        const user = await this.userService.findByTelegramId(telegramId);
        language = user.language || 'uz';

        if (data.startsWith('lang_')) {
          const selectedLanguage = data.split('_')[1];
          await this.userService.updateLanguage(telegramId, selectedLanguage);
          const message = selectedLanguage === 'uz'
            ? '✅ O‘zbek tili tanlandi. Iltimos, telefon raqamingizni yuboring:'
            : '✅ Выбран русский язык. Пожалуйста, отправьте ваш номер телефона:';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getMainKeyboard(true, selectedLanguage),
          });
        } else if (data.startsWith('category_')) {
          const categoryId = parseInt(data.split('_')[1]);
          const products = await this.productService.findByCategory(categoryId);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map((prod) => [
            { text: `${prod.name} - ${prod.price} ${language === 'uz' ? 'so‘m' : 'сум'}`, callback_data: `product_${prod.id}` },
          ]);
          const message = language === 'uz' ? '📦 Mahsulotlar:' : '📦 Товары:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('product_')) {
          const productId = parseInt(data.split('_')[1]);
          const product = await this.productService.findOne(productId);
          await this.telegramService.sendPhoto(chatId, product.imageUrl, {
            caption: formatProductMessage(product, language),
            reply_markup: {
              inline_keyboard: [
                [{ text: language === 'uz' ? '➕ Savatchaga qo‘shish' : '➕ Добавить в корзину', callback_data: `addtocart_${productId}` }],
                [{ text: language === 'uz' ? '⭐ Feedback qoldirish' : '⭐ Оставить отзыв', callback_data: `feedback_${productId}` }],
              ],
            },
          });
        } else if (data.startsWith('addtocart_')) {
          const productId = parseInt(data.split('_')[1]);
          await this.cartService.addToCart({ telegramId, productId, quantity: 1 });
          const message = language === 'uz' ? '✅ Mahsulot savatchaga qo‘shildi.' : '✅ Товар добавлен в корзину.';
          await this.telegramService.sendMessage(chatId, message);
        } else if (data === 'place_order') {
          const order = await this.orderService.createOrder(telegramId);
          const message = language === 'uz'
            ? '📍 Iltimos, yetkazib berish manzilingizni yuboring:'
            : '📍 Пожалуйста, отправьте адрес доставки:';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: {
              keyboard: [[{ text: language === 'uz' ? '📍 Manzilni yuborish' : '📍 Отправить адрес', request_location: true }]],
              one_time_keyboard: true,
              resize_keyboard: true,
            },
          });
          bot.once('location', async (msg) => {
            try {
              const addressMessage = language === 'uz'
                ? '🏠 Iltimos, xonadon raqami, qavat yoki qo‘shimcha ma’lumotlarni kiriting (masalan: 12-xonadon, 3-qavat):'
                : '🏠 Пожалуйста, укажите номер квартиры, этаж или дополнительные сведения (например: квартира 12, 3 этаж):';
              await this.telegramService.sendMessage(chatId, addressMessage, {
                reply_markup: { force_reply: true },
              });
              bot.once('message', async (msgDetails) => {
                try {
                  const delivery = await this.deliveryService.create({
                    orderId: order.id,
                    latitude: msg.location.latitude,
                    longitude: msg.location.longitude,
                    addressDetails: msgDetails.text,
                  });
                  const items = order.orderItems?.map((item) => `${item.product.name} - ${item.quantity} ${language === 'uz' ? 'dona' : 'шт.'}`).join(', ');
                  const message = language === 'uz'
                    ? `💳 Buyurtma yaratildi! Iltimos, quyidagi havola orqali to‘lovni amalga oshiring.\n` +
                      `  📋 ID: ${order.id}\n` +
                      `  👤 Foydalanuvchi: ${order.user?.fullName || 'Kiritilmagan'}\n` +
                      `  📦 Mahsulotlar: ${items || 'N/A'}\n` +
                      `  💸 Jami: ${order.totalAmount} so‘m\n` +
                      `  📍 Manzil: (${delivery.latitude}, ${delivery.longitude})\n` +
                      `  🏠 Qo‘shimcha: ${delivery.addressDetails || 'N/A'}\n` +
                      `━━━━━━━━━━━━━━━`
                    : `💳 Заказ создан! Пожалуйста, оплатите по следующей ссылке.\n` +
                      `  📋 ID: ${order.id}\n` +
                      `  👤 Пользователь: ${order.user?.fullName || 'Не указано'}\n` +
                      `  📦 Товары: ${items || 'N/A'}\n` +
                      `  💸 Итого: ${order.totalAmount} сум\n` +
                      `  📍 Адрес: (${delivery.latitude}, ${delivery.longitude})\n` +
                      `  🏠 Дополнительно: ${delivery.addressDetails || 'N/A'}\n` +
                      `━━━━━━━━━━━━━━━`;
                  await this.telegramService.sendMessage(chatId, message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: language === 'uz' ? '💵 Click orqali to‘lash' : '💵 Оплатить через Click', callback_data: `confirm_payment_${order.id}_click` }],
                        [{ text: language === 'uz' ? '💵 Payme orqali to‘lash' : '💵 Оплатить через Payme', callback_data: `confirm_payment_${order.id}_payme` }],
                      ],
                    },
                  });
                } catch (error) {
                  this.logger.error(`Error in delivery: ${error.message}`);
                  const errorMessage = language === 'uz'
                    ? '❌ Yetkazib berish ma’lumotlarini saqlashda xato yuz berdi.'
                    : '❌ Ошибка при сохранении данных доставки.';
                  await this.telegramService.sendMessage(chatId, errorMessage);
                }
              });
            } catch (error) {
              this.logger.error(`Error in delivery: ${error.message}`);
              const errorMessage = language === 'uz'
                ? '❌ Yetkazib berish manzilini saqlashda xato yuz berdi.'
                : '❌ Ошибка при сохранении адреса доставки.';
              await this.telegramService.sendMessage(chatId, errorMessage);
            }
          });
        } else if (data.startsWith('confirm_payment_')) {
          const parts = data.split('_');
          const orderId = parseInt(parts[2], 10);
          const paymentType = parts[3];

          this.logger.log(`Confirming payment for orderId: ${orderId}, paymentType: ${paymentType}`);

          if (![PAYMENT_TYPE.CLICK, PAYMENT_TYPE.PAYME].includes(paymentType)) {
            this.logger.error(`Invalid payment type: ${paymentType}`);
            const message = language === 'uz' ? '❌ Noto‘g‘ri to‘lov turi.' : '❌ Неверный тип оплаты.';
            await this.telegramService.sendMessage(chatId, message);
            return;
          }

          const order = await this.orderService.findOne(orderId);
          if (!order) {
            this.logger.error(`Order not found for ID: ${orderId}`);
            const message = language === 'uz' ? '❌ Buyurtma topilmadi.' : '❌ Заказ не найден.';
            await this.telegramService.sendMessage(chatId, message);
            return;
          }

          const delivery = await this.deliveryService.findOneByOrderId(order.id);
          if (!delivery) {
            this.logger.error(`Delivery not found for order ID: ${orderId}`);
            const message = language === 'uz' ? '❌ Yetkazib berish ma’lumotlari topilmadi.' : '❌ Данные доставки не найдены.';
            await this.telegramService.sendMessage(chatId, message);
            return;
          }

          await this.orderService.updateStatus(orderId, ORDER_STATUS.PAID);
          await this.orderService.update(orderId, { paymentType });

          const items = order.orderItems?.map((item) => `${item.product.name} - ${item.quantity} ${language === 'uz' ? 'dona' : 'шт.'}`).join(', ');
          const message = language === 'uz'
            ? `✅ Buyurtma tasdiqlandi!\n` +
              `  📋 ID: ${order.id}\n` +
              `  👤 Foydalanuvchi: ${order.user?.fullName || 'Kiritilmagan'}\n` +
              `  📦 Mahsulotlar: ${items || 'N/A'}\n` +
              `  💸 Jami: ${order.totalAmount} so‘m\n` +
              `  📊 Status: ${ORDER_STATUS.PAID}\n` +
              `  💵 To‘lov turi: ${paymentType}\n` +
              `  📍 Manzil: (${delivery.latitude}, ${delivery.longitude})\n` +
              `  🏠 Qo‘shimcha: ${delivery.addressDetails || 'N/A'}\n` +
              `  🚚 Yetkazib beruvchi: ${delivery.courierName || 'N/A'}\n` +
              `  📞 Telefon: ${delivery.courierPhone || 'N/A'}\n` +
              `  📅 Taxminiy yetkazib berish sanasi: ${delivery.deliveryDate?.toLocaleString('uz-UZ') || 'N/A'}\n` +
              `━━━━━━━━━━━━━━━`
            : `✅ Заказ подтвержден!\n` +
              `  📋 ID: ${order.id}\n` +
              `  👤 Пользователь: ${order.user?.fullName || 'Не указано'}\n` +
              `  📦 Товары: ${items || 'N/A'}\n` +
              `  💸 Итого: ${order.totalAmount} сум\n` +
              `  📊 Статус: ${ORDER_STATUS.PAID}\n` +
              `  💵 Тип оплаты: ${paymentType}\n` +
              `  📍 Адрес: (${delivery.latitude}, ${delivery.longitude})\n` +
              `  🏠 Дополнительно: ${delivery.addressDetails || 'N/A'}\n` +
              `  🚚 Курьер: ${delivery.courierName || 'N/A'}\n` +
              `  📞 Телефон: ${delivery.courierPhone || 'N/A'}\n` +
              `  📅 Ожидаемая дата доставки: ${delivery.deliveryDate?.toLocaleString('ru-RU') || 'N/A'}\n` +
              `━━━━━━━━━━━━━━━`;

          await this.telegramService.sendMessage(chatId, message, { parse_mode: 'HTML' });

          const adminChatId = '5661241603';
          await this.telegramService.sendMessage(adminChatId, message, { parse_mode: 'HTML' });
        } else if (data.startsWith('feedback_')) {
          const productId = parseInt(data.split('_')[1]);
          const message = language === 'uz' ? '⭐ Reytingni tanlang:' : '⭐ Выберите рейтинг:';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⭐ 1', callback_data: `rate_${productId}_1` },
                  { text: '⭐ 2', callback_data: `rate_${productId}_2` },
                  { text: '⭐ 3', callback_data: `rate_${productId}_3` },
                  { text: '⭐ 4', callback_data: `rate_${productId}_4` },
                  { text: '⭐ 5', callback_data: `rate_${productId}_5` },
                ],
              ],
            },
          });
        } else if (data.startsWith('rate_')) {
          const [_, productId, rating] = data.split('_');
          const message = language === 'uz' ? '💬 Izoh yozing:' : '💬 Напишите комментарий:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              await this.feedbackService.create({
                telegramId,
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment: msg.text,
              });
              const successMessage = language === 'uz' ? '✅ Feedback qabul qilindi!' : '✅ Отзыв принят!';
              await this.telegramService.sendMessage(chatId, successMessage);
            } catch (error) {
              this.logger.error(`Error in feedback: ${error.message}`);
              const errorMessage = language === 'uz' ? '❌ Feedback qoldirishda xato yuz berdi.' : '❌ Ошибка при отправке отзыва.';
              await this.telegramService.sendMessage(chatId, errorMessage);
            }
          });
        } else if (data === 'clear_cart') {
          await this.cartService.clearCart(telegramId);
          const message = language === 'uz' ? '🗑 Savatcha tozalandi.' : '🗑 Корзина очищена.';
          await this.telegramService.sendMessage(chatId, message);
        }
      } catch (error) {
        this.logger.error(`Error in user callback: ${error.message}`);
        const message = language === 'uz' ? '❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.' : '❌ Произошла ошибка, попробуйте позже.';
        await this.telegramService.sendMessage(chatId, message);
      }
    });
  }
}