import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CategoryService } from '../../category/category.service';
import { ProductService } from '../../product/product.service';
import { CartService } from '../../cart/cart.service';
import { OrderService } from '../../order/order.service';
import { FeedbackService } from '../../feedback/feedback.service';
import { PaymentService } from '../../payment/payment.service';
import { UserService } from '../../user/user.service';
import { DeliveryService } from '../../delivery/delivery.service';
import { TelegramService } from '../telegram.service';
import { formatProductMessage, formatOrderList } from '../utils/helpers';
import { PAYMENT_TYPE, ORDER_STATUS } from '../../../common/constants';
import { getMainKeyboard } from '../utils/keyboards';

@Injectable()
export class UserCallbackHandler {
  private logger = new Logger(UserCallbackHandler.name);

  constructor(
    private categoryService: CategoryService,
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
      try {
        this.logger.log(`Processing user callback: ${data} for telegramId: ${telegramId}`);
        let user = await this.userService.findByTelegramId(telegramId);
        let language = user?.language || 'uz';

        if (data.startsWith('lang_')) {
          const selectedLanguage = data.split('_')[1];
          if (['uz', 'ru'].includes(selectedLanguage)) {
            await this.userService.updateLanguage(telegramId, selectedLanguage);
            user = await this.userService.findByTelegramId(telegramId); // Yangilangan foydalanuvchi ma'lumotlarini olish
            language = selectedLanguage;
            const message = language === 'uz'
              ? '✅ Til o‘zbekchaga o‘zgartirildi!'
              : '✅ Язык изменен на русский!';
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: {
                inline_keyboard: [], // Til tanlanganidan keyin menyuni yopish
              },
            });
            if (!user.phone) {
              const phoneMessage = language === 'uz'
                ? 'Iltimos, telefon raqamingizni yuboring:'
                : 'Пожалуйста, отправьте ваш номер телефона:';
              await this.telegramService.sendMessage(chatId, phoneMessage, {
                reply_markup: getMainKeyboard(true, language),
              });
            } else {
              const welcomeMessage = language === 'uz'
                ? `Qaytganingizdan xursandmiz, ${user.fullName || 'Foydalanuvchi'}! 🛒 Do‘konimizdan bemalol foydalaning!`
                : `Рады вашему возвращению, ${user.fullName || 'Пользователь'}! 🛒 Пользуйтесь нашим магазином!`;
              await this.telegramService.sendMessage(chatId, welcomeMessage, {
                reply_markup: getMainKeyboard(false, language),
              });
            }
          } else {
            this.logger.error(`Invalid language selected: ${selectedLanguage}`);
            const errorMessage = language === 'uz'
              ? '❌ Noto‘g‘ri til tanlandi.'
              : '❌ Выбран неверный язык.';
            await this.telegramService.sendMessage(chatId, errorMessage, {});
          }
        } else if (!user || !user.language) {
          // Agar foydalanuvchi yoki til tanlanmagan bo‘lsa, til tanlashni so‘rash
          await this.telegramService.sendMessage(
            chatId,
            language === 'uz'
              ? 'Iltimos, avval tilni tanlang:'
              : 'Пожалуйста, сначала выберите язык:',
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
        } else if (data.startsWith('category_')) {
          const categoryId = parseInt(data.split('_')[1]);
          const category = await this.categoryService.findOne(categoryId);
          if (!category) {
            const message = language === 'uz'
              ? `❌ Kategoriya ID ${categoryId} topilmadi.`
              : `❌ Категория с ID ${categoryId} не найдена.`;
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }
          const products = await this.productService.findByCategory(categoryId);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map((prod) => [
            {
              text: `${language === 'uz' ? prod.name : prod.nameRu || prod.name} - ${prod.price} so‘m`,
              callback_data: `product_${prod.id}`,
            },
          ]);
          const message = language === 'uz'
            ? `📦 ${category.name} kategoriyasidagi mahsulotlar:`
            : `📦 Товары в категории ${category.nameRu || category.name}:`;
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data.startsWith('product_')) {
          const productId = parseInt(data.split('_')[1]);
          const product = await this.productService.findOne(productId);
          if (!product) {
            const message = language === 'uz'
              ? `❌ Mahsulot ID ${productId} topilmadi.`
              : `❌ Товар с ID ${productId} не найден.`;
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }
          await this.telegramService.sendPhoto(chatId, product.imageUrl, {
            caption: formatProductMessage(product, language),
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: language === 'uz' ? '➕ Savatchaga qo‘shish' : '➕ Добавить в корзину', callback_data: `addtocart_${productId}` }],
                [{ text: language === 'uz' ? '⭐ Feedback qoldirish' : '⭐ Оставить отзыв', callback_data: `feedback_${productId}` }],
              ],
            },
          });
        } else if (data.startsWith('addtocart_')) {
          const productId = parseInt(data.split('_')[1]);
          const product = await this.productService.findOne(productId);
          if (!product) {
            const message = language === 'uz'
              ? `❌ Mahsulot ID ${productId} topilmadi.`
              : `❌ Товар с ID ${productId} не найден.`;
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }
          await this.cartService.addToCart({ telegramId, productId, quantity: 1 });
          const message = language === 'uz'
            ? `✅ ${product.name} savatchaga qo‘shildi.`
            : `✅ ${product.nameRu || product.name} добавлен в корзину.`;
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getMainKeyboard(false, language),
          });
        } else if (data === 'place_order') {
          const order = await this.orderService.createOrder(telegramId);
          if (!order) {
            const message = language === 'uz'
              ? '❌ Buyurtma yaratishda xato yuz berdi.'
              : '❌ Ошибка при создании заказа.';
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }
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
              const detailsMessage = language === 'uz'
                ? '🏠 Iltimos, xonadon raqami, qavat yoki qo‘shimcha ma’lumotlarni kiriting (masalan: 12-xonadon, 3-qavat):'
                : '🏠 Пожалуйста, укажите номер квартиры, этаж или дополнительные сведения (например: квартира 12, 3 этаж):';
              await this.telegramService.sendMessage(chatId, detailsMessage, {
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
                  const items = order.orderItems?.map((item) =>
                    `${language === 'uz' ? item.product.name : item.product.nameRu || item.product.name} - ${item.quantity} ${language === 'uz' ? 'dona' : 'шт.'}`
                  ).join(', ');
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
                      `  💸 Итого: ${order.totalAmount} so‘m\n` +
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
                  await this.telegramService.sendMessage(chatId, errorMessage, {
                    reply_markup: getMainKeyboard(false, language),
                  });
                }
              });
            } catch (error) {
              this.logger.error(`Error in delivery: ${error.message}`);
              const errorMessage = language === 'uz'
                ? '❌ Yetkazib berish manzilini saqlashda xato yuz berdi.'
                : '❌ Ошибка при сохранении адреса доставки.';
              await this.telegramService.sendMessage(chatId, errorMessage, {
                reply_markup: getMainKeyboard(false, language),
              });
            }
          });
        } else if (data.startsWith('confirm_payment_')) {
          const parts = data.split('_');
          const orderId = parseInt(parts[2], 10);
          const paymentType = parts[3];

          this.logger.log(`Confirming payment for orderId: ${orderId}, paymentType: ${paymentType}`);

          if (![PAYMENT_TYPE.CLICK, PAYMENT_TYPE.PAYME].includes(paymentType)) {
            this.logger.error(`Invalid payment type: ${paymentType}`);
            const errorMessage = language === 'uz' ? '❌ Noto‘g‘ri to‘lov turi.' : '❌ Неверный тип оплаты.';
            await this.telegramService.sendMessage(chatId, errorMessage, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }

          const order = await this.orderService.findOne(orderId);
          if (!order) {
            this.logger.error(`Order not found for ID: ${orderId}`);
            const errorMessage = language === 'uz' ? '❌ Buyurtma topilmadi.' : '❌ Заказ не найден.';
            await this.telegramService.sendMessage(chatId, errorMessage, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }

          const delivery = await this.deliveryService.findOneByOrderId(order.id);
          if (!delivery) {
            this.logger.error(`Delivery not found for order ID: ${orderId}`);
            const errorMessage = language === 'uz' ? '❌ Yetkazib berish ma’lumotlari topilmadi.' : '❌ Данные доставки не найдены.';
            await this.telegramService.sendMessage(chatId, errorMessage, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }

          await this.orderService.updateStatus(orderId, ORDER_STATUS.PAID);
          await this.orderService.update(orderId, { paymentType });

          const items = order.orderItems?.map((item) =>
            `${language === 'uz' ? item.product.name : item.product.nameRu || item.product.name} - ${item.quantity} ${language === 'uz' ? 'dona' : 'шт.'}`
          ).join(', ');
          const message = language === 'uz'
            ? `✅ Buyurtma tasdiqlandi!\n` +
              `  📋 ID: ${order.id}\n` +
              `  👤 Foydalanuvchi: ${order.user?.fullName || 'Kiritilmagan'}\n` +
              `  📦 Mahsulotlar: ${items || 'N/A'}\n` +
              `  💸 Jami: ${order.totalAmount} so‘m\n` +
              `  📊 Status: ${order.status}\n` +
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
              `  💸 Итого: ${order.totalAmount} so‘m\n` +
              `  📊 Статус: ${order.status}\n` +
              `  💵 Тип оплаты: ${paymentType}\n` +
              `  📍 Адрес: (${delivery.latitude}, ${delivery.longitude})\n` +
              `  🏠 Дополнительно: ${delivery.addressDetails || 'N/A'}\n` +
              `  🚚 Курьер: ${delivery.courierName || 'N/A'}\n` +
              `  📞 Телефон: ${delivery.courierPhone || 'N/A'}\n` +
              `  📅 Ориентировочная дата доставки: ${delivery.deliveryDate?.toLocaleString('ru-RU') || 'N/A'}\n` +
              `━━━━━━━━━━━━━━━`;

          await this.telegramService.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            reply_markup: getMainKeyboard(false, language),
          });

          const adminChatId = '5661241603';
          await this.telegramService.sendMessage(adminChatId, message, {
            parse_mode: 'HTML',
          });
        } else if (data.startsWith('feedback_')) {
          const productId = parseInt(data.split('_')[1]);
          const product = await this.productService.findOne(productId);
          if (!product) {
            const message = language === 'uz'
              ? `❌ Mahsulot ID ${productId} topilmadi.`
              : `❌ Товар с ID ${productId} не найден.`;
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }
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
          const product = await this.productService.findOne(parseInt(productId));
          if (!product) {
            const message = language === 'uz'
              ? `❌ Mahsulot ID ${productId} topilmadi.`
              : `❌ Товар с ID ${productId} не найден.`;
            await this.telegramService.sendMessage(chatId, message, {
              reply_markup: getMainKeyboard(false, language),
            });
            return;
          }
          const message = language === 'uz' ? '💬 Izoh yozing:' : '💬 Напишите комментарий:';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: { force_reply: true },
          });
          bot.once('message', async (msg) => {
            try {
              await this.feedbackService.create({
                telegramId,
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment: msg.text,
              });
              const successMessage = language === 'uz'
                ? '✅ Feedback qabul qilindi!'
                : '✅ Отзыв принят!';
              await this.telegramService.sendMessage(chatId, successMessage, {
                reply_markup: getMainKeyboard(false, language),
              });
            } catch (error) {
              this.logger.error(`Error in feedback: ${error.message}`);
              const errorMessage = language === 'uz'
                ? '❌ Feedback qoldirishda xato yuz berdi.'
                : '❌ Ошибка при отправке отзыва.';
              await this.telegramService.sendMessage(chatId, errorMessage, {
                reply_markup: getMainKeyboard(false, language),
              });
            }
          });
        } else if (data === 'clear_cart') {
          await this.cartService.clearCart(telegramId);
          const message = language === 'uz' ? '🗑 Savatcha tozalandi.' : '🗑 Корзина очищена.';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getMainKeyboard(false, language),
          });
        } else if (data.startsWith('view_orders_')) {
          const page = parseInt(data.split('_')[2]) || 1;
          const orders = await this.orderService.getUserOrders(telegramId, page, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
          if (orders.length === 10) {
            keyboard.push([{ text: language === 'uz' ? '➡️ Keyingi sahifa' : '➡️ Следующая страница', callback_data: `view_orders_${page + 1}` }]);
          }
          if (page > 1) {
            keyboard.push([{ text: language === 'uz' ? '⬅️ Oldingi sahifa' : '⬅️ Предыдущая страница', callback_data: `view_orders_${page - 1}` }]);
          }
          const message = orders.length ? formatOrderList(orders, language) : 
            language === 'uz' ? '❌ Buyurtmalar mavjud emas.' : '❌ Заказы отсутствуют.';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: { inline_keyboard: keyboard.length ? keyboard : getMainKeyboard(false, language) },
            parse_mode: 'HTML',
          });
        } else {
          const message = language === 'uz'
            ? '❌ Noto‘g‘ri buyruq. Iltimos, menyudan foydalaning.'
            : '❌ Неверная команда. Пожалуйста, используйте меню.';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getMainKeyboard(false, language),
          });
        }
      } catch (error) {
        this.logger.error(`Error in user callback: ${error.message}`);
        const user = await this.userService.findByTelegramId(telegramId);
        const language = user?.language || 'uz';
        const message = language === 'uz'
          ? '❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.'
          : '❌ Произошла ошибка, попробуйте позже.';
        await this.telegramService.sendMessage(chatId, message, {
          reply_markup: getMainKeyboard(false, language),
        });
      } finally {
        try {
          await bot.answerCallbackQuery(query.id);
        } catch (err) {
          this.logger.error(`Error in answerCallbackQuery: ${err.message}`);
        }
      }
    });
  }
}