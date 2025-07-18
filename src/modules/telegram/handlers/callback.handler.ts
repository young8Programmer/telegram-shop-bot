import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { CategoryService } from '../../category/category.service';
import { ProductService } from '../../product/product.service';
import { CartService } from '../../cart/cart.service';
import { OrderService } from '../../order/order.service';
import { FeedbackService } from '../../feedback/feedback.service';
import { PromocodeService } from '../../promocode/promocode.service';
import { PaymentService } from '../../payment/payment.service';
import { UserService } from '../../user/user.service';
import { DeliveryService } from '../../delivery/delivery.service';
import { TelegramService } from '../telegram.service';
import { formatProductMessage, formatCategoryList, formatProductList, formatUserList, formatOrderList, formatFeedbackList, formatDeliveryList, formatStats } from '../utils/helpers';
import { PAYMENT_TYPE, ORDER_STATUS } from '../../../common/constants';
import { getMainKeyboard, getAdminKeyboard } from '../utils/keyboards';

@Injectable()
export class CallbackHandler {
  private logger = new Logger(CallbackHandler.name);

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService,
    private feedbackService: FeedbackService,
    private promocodeService: PromocodeService,
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
        this.logger.log(`Processing callback: ${data} for telegramId: ${telegramId}`);
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
        } else if (data === 'add_category') {
          const message = language === 'uz' ? '📋 Kategoriya nomini kiriting:' : '📋 Введите название категории:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msgName) => {
            const name = msgName.text;
            const descMessage = language === 'uz' ? '📝 Kategoriya tavsifini kiriting:' : '📝 Введите описание категории:';
            await this.telegramService.sendMessage(chatId, descMessage, { reply_markup: { force_reply: true } });
            bot.once('message', async (msgDesc) => {
              try {
                await this.categoryService.create({ name, description: msgDesc.text });
                const successMessage = language === 'uz' ? '✅ Kategoriya qo‘shildi!' : '✅ Категория добавлена!';
                await this.telegramService.sendMessage(chatId, successMessage, {
                  reply_markup: getAdminKeyboard(language),
                });
              } catch (error) {
                this.logger.error(`Error in add_category: ${error.message}`);
                const errorMessage = language === 'uz' ? '❌ Kategoriya qo‘shishda xato yuz berdi.' : '❌ Ошибка при добавлении категории.';
                await this.telegramService.sendMessage(chatId, errorMessage);
              }
            });
          });
        } else if (data === 'view_categories') {
          const categories = await this.categoryService.findAll();
          await this.telegramService.sendMessage(chatId, formatCategoryList(categories, language), {
            parse_mode: 'HTML',
            reply_markup: getAdminKeyboard(language),
          });
        } else if (data === 'edit_category') {
          const categories = await this.categoryService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = categories.map((cat) => [
            { text: cat.name, callback_data: `edit_cat_${cat.id}` },
          ]);
          const message = language === 'uz' ? '✏️ Tahrir qilinadigan kategoriyani tanlang:' : '✏️ Выберите категорию для редактирования:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          const message = language === 'uz' ? '📋 Yangi kategoriya nomini kiriting:' : '📋 Введите новое название категории:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msgName) => {
            const name = msgName.text;
            const descMessage = language === 'uz' ? '📝 Yangi kategoriya tavsifini kiriting:' : '📝 Введите новое описание категории:';
            await this.telegramService.sendMessage(chatId, descMessage, { reply_markup: { force_reply: true } });
            bot.once('message', async (msgDesc) => {
              try {
                await this.categoryService.update(categoryId, { name, description: msgDesc.text });
                const successMessage = language === 'uz' ? '✅ Kategoriya yangilandi!' : '✅ Категория обновлена!';
                await this.telegramService.sendMessage(chatId, successMessage, {
                  reply_markup: getAdminKeyboard(language),
                });
              } catch (error) {
                this.logger.error(`Error in edit_category: ${error.message}`);
                const errorMessage = language === 'uz' ? '❌ Kategoriyani tahrirlashda xato yuz berdi.' : '❌ Ошибка при редактировании категории.';
                await this.telegramService.sendMessage(chatId, errorMessage);
              }
            });
          });
        } else if (data === 'delete_category') {
          const categories = await this.categoryService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = categories.map((cat) => [
            { text: cat.name, callback_data: `delete_cat_${cat.id}` },
          ]);
          const message = language === 'uz' ? '🗑 O‘chiriladigan kategoriyani tanlang:' : '🗑 Выберите категорию для удаления:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_cat_')) {
          const categoryId = parseInt(data.split('_')[2]);
          await this.categoryService.remove(categoryId);
          const message = language === 'uz' ? '✅ Kategoriya o‘chirildi.' : '✅ Категория удалена.';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getAdminKeyboard(language),
          });
        } else if (data === 'add_product') {
          const message = language === 'uz'
            ? '📦 Mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID;ombordagi soni):'
            : '📦 Введите данные товара (название;цена;описание;URL изображения;ID категории;кол-во на складе):';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId, stock] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              const parsedStock = parseInt(stock.trim());
              if (isNaN(parsedCategoryId) || isNaN(parsedStock)) {
                const errorMessage = language === 'uz'
                  ? '❌ Kategoriya ID yoki ombor soni noto‘g‘ri.'
                  : '❌ Неверный ID категории или количество на складе.';
                await this.telegramService.sendMessage(chatId, errorMessage);
                return;
              }
              const category = await this.categoryService.findOne(parsedCategoryId);
              if (!category) {
                const errorMessage = language === 'uz'
                  ? `❌ Kategoriya ID ${parsedCategoryId} topilmadi.`
                  : `❌ Категория с ID ${parsedCategoryId} не найдена.`;
                await this.telegramService.sendMessage(chatId, errorMessage);
                return;
              }
              await this.productService.create({
                name: name.trim(),
                price: parseFloat(price.trim()),
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                categoryId: parsedCategoryId,
                stock: parsedStock,
                isActive: true,
              });
              const successMessage = language === 'uz' ? '✅ Mahsulot qo‘shildi.' : '✅ Товар добавлен.';
              await this.telegramService.sendMessage(chatId, successMessage, {
                reply_markup: getAdminKeyboard(language),
              });
            } catch (error) {
              this.logger.error(`Error in add_product: ${error.message}`);
              const errorMessage = language === 'uz' ? '❌ Mahsulot qo‘shishda xato yuz berdi.' : '❌ Ошибка при добавлении товара.';
              await this.telegramService.sendMessage(chatId, errorMessage);
            }
          });
        } else if (data === 'view_products') {
          const products = await this.productService.findAll();
          await this.telegramService.sendMessage(chatId, formatProductList(products, language), {
            parse_mode: 'HTML',
            reply_markup: getAdminKeyboard(language),
          });
        } else if (data === 'edit_product') {
          const products = await this.productService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map((prod) => [
            { text: prod.name, callback_data: `edit_prod_${prod.id}` },
          ]);
          const message = language === 'uz' ? '✏️ Tahrir qilinadigan mahsulotni tanlang:' : '✏️ Выберите товар для редактирования:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          const message = language === 'uz'
            ? '📦 Yangi mahsulot ma‘lumotlarini kiriting (nomi;narxi;tasviri;rasm URL;kategoriya ID;ombordagi soni):'
            : '📦 Введите новые данные товара (название;цена;описание;URL изображения;ID категории;кол-во на складе):';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [name, price, description, imageUrl, categoryId, stock] = msg.text.split(';');
              const parsedCategoryId = parseInt(categoryId.trim());
              const parsedStock = parseInt(stock.trim());
              if (isNaN(parsedCategoryId) || isNaN(parsedStock)) {
                const errorMessage = language === 'uz'
                  ? '❌ Kategoriya ID yoki ombor soni noto‘g‘ri.'
                  : '❌ Неверный ID категории или количество на складе.';
                await this.telegramService.sendMessage(chatId, errorMessage);
                return;
              }
              const category = await this.categoryService.findOne(parsedCategoryId);
              if (!category) {
                const errorMessage = language === 'uz'
                  ? `❌ Kategoriya ID ${parsedCategoryId} topilmadi.`
                  : `❌ Категория с ID ${parsedCategoryId} не найдена.`;
                await this.telegramService.sendMessage(chatId, errorMessage);
                return;
              }
              await this.productService.update(productId, {
                name: name.trim(),
                price: parseFloat(price.trim()),
                description: description.trim(),
                imageUrl: imageUrl.trim(),
                categoryId: parsedCategoryId,
                stock: parsedStock,
              });
              const successMessage = language === 'uz' ? '✅ Mahsulot yangilandi.' : '✅ Товар обновлен.';
              await this.telegramService.sendMessage(chatId, successMessage, {
                reply_markup: getAdminKeyboard(language),
              });
            } catch (error) {
              this.logger.error(`Error in edit_product: ${error.message}`);
              const errorMessage = language === 'uz' ? '❌ Mahsulotni tahrirlashda xato yuz berdi.' : '❌ Ошибка при редактировании товара.';
              await this.telegramService.sendMessage(chatId, errorMessage);
            }
          });
        } else if (data === 'delete_product') {
          const products = await this.productService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = products.map((prod) => [
            { text: prod.name, callback_data: `delete_prod_${prod.id}` },
          ]);
          const message = language === 'uz' ? '🗑 O‘chiriladigan mahsulotni tanlang:' : '🗑 Выберите товар для удаления:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_prod_')) {
          const productId = parseInt(data.split('_')[2]);
          await this.productService.remove(productId);
          const message = language === 'uz' ? '✅ Mahsulot o‘chirildi.' : '✅ Товар удален.';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getAdminKeyboard(language),
          });
        } else if (data === 'view_users') {
          const users = await this.userService.findAll();
          await this.telegramService.sendMessage(chatId, formatUserList(users, language), {
            parse_mode: 'HTML',
            reply_markup: getAdminKeyboard(language),
          });
        } else if (data === 'edit_user') {
          const users = await this.userService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = users.map((user) => [
            { text: user.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано'), callback_data: `edit_user_${user.id}` },
          ]);
          const message = language === 'uz' ? '✏️ Tahrir qilinadigan foydalanuvchini tanlang:' : '✏️ Выберите пользователя для редактирования:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_user_')) {
          const userId = parseInt(data.split('_')[2]);
          const message = language === 'uz'
            ? '👤 Yangi ism va telefon raqamini kiriting (ism;telefon):'
            : '👤 Введите новое имя и номер телефона (имя;телефон):';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [fullName, phone] = msg.text.split(';');
              await this.userService.update(userId, { fullName: fullName.trim(), phone: phone.trim() });
              const successMessage = language === 'uz' ? '✅ Foydalanuvchi ma‘lumotlari yangilandi.' : '✅ Данные пользователя обновлены.';
              await this.telegramService.sendMessage(chatId, successMessage, {
                reply_markup: getAdminKeyboard(language),
              });
            } catch (error) {
              this.logger.error(`Error in edit_user: ${error.message}`);
              const errorMessage = language === 'uz' ? '❌ Foydalanuvchini tahrirlashda xato yuz berdi.' : '❌ Ошибка при редактировании пользователя.';
              await this.telegramService.sendMessage(chatId, errorMessage);
            }
          });
        } else if (data === 'delete_user') {
          const users = await this.userService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = users.map((user) => [
            { text: user.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано'), callback_data: `delete_user_${user.id}` },
          ]);
          const message = language === 'uz' ? '🗑 O‘chiriladigan foydalanuvchini tanlang:' : '🗑 Выберите пользователя для удаления:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_user_')) {
          const userId = parseInt(data.split('_')[2]);
          await this.userService.remove(userId);
          const message = language === 'uz' ? '✅ Foydalanuvchi o‘chirildi.' : '✅ Пользователь удален.';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getAdminKeyboard(language),
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
          await this.telegramService.sendMessage(chatId, formatOrderList(orders, language), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data === 'view_orders') {
          const orders = await this.orderService.findAll(1, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = orders.length === 10 ? [[{ text: language === 'uz' ? '➡️ Keyingi sahifa' : '➡️ Следующая страница', callback_data: 'view_orders_2' }]] : [];
          await this.telegramService.sendMessage(chatId, formatOrderList(orders, language), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data.startsWith('view_deliveries_')) {
          const page = parseInt(data.split('_')[2]) || 1;
          const deliveries = await this.deliveryService.findAll(page, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
          if (deliveries.length === 10) {
            keyboard.push([{ text: language === 'uz' ? '➡️ Keyingi sahifa' : '➡️ Следующая страница', callback_data: `view_deliveries_${page + 1}` }]);
          }
          if (page > 1) {
            keyboard.push([{ text: language === 'uz' ? '⬅️ Oldingi sahifa' : '⬅️ Предыдущая страница', callback_data: `view_deliveries_${page - 1}` }]);
          }
          await this.telegramService.sendMessage(chatId, formatDeliveryList(deliveries, language), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data === 'view_deliveries') {
          const deliveries = await this.deliveryService.findAll(1, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = deliveries.length === 10 ? [[{ text: language === 'uz' ? '➡️ Keyingi sahifa' : '➡️ Следующая страница', callback_data: 'view_deliveries_2' }]] : [];
          await this.telegramService.sendMessage(chatId, formatDeliveryList(deliveries, language), {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML',
          });
        } else if (data === 'edit_delivery') {
          const deliveries = await this.deliveryService.findAll(1, 10);
          const keyboard: TelegramBot.InlineKeyboardButton[][] = deliveries.map((delivery) => [
            { text: `📋 ID: ${delivery.id}`, callback_data: `edit_delivery_${delivery.id}` },
          ]);
          const message = language === 'uz' ? '✏️ Tahrir qilinadigan yetkazib berishni tanlang:' : '✏️ Выберите доставку для редактирования:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('edit_delivery_')) {
          const deliveryId = parseInt(data.split('_')[2]);
          const message = language === 'uz'
            ? '📊 Yangi statusni kiriting (pending, in_transit, delivered, cancelled):'
            : '📊 Введите новый статус (pending, in_transit, delivered, cancelled):';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              await this.deliveryService.update(deliveryId, { status: msg.text });
              const successMessage = language === 'uz' ? '✅ Yetkazib berish statusi yangilandi.' : '✅ Статус доставки обновлен.';
              await this.telegramService.sendMessage(chatId, successMessage, {
                reply_markup: getAdminKeyboard(language),
              });
            } catch (error) {
              this.logger.error(`Error in edit_delivery: ${error.message}`);
              const errorMessage = language === 'uz' ? '❌ Yetkazib berish statusini yangilashda xato yuz berdi.' : '❌ Ошибка при обновлении статуса доставки.';
              await this.telegramService.sendMessage(chatId, errorMessage);
            }
          });
        } else if (data === 'view_feedback') {
          const feedbacks = await this.feedbackService.findAll();
          await this.telegramService.sendMessage(chatId, formatFeedbackList(feedbacks, language), {
            parse_mode: 'HTML',
            reply_markup: getAdminKeyboard(language),
          });
        } else if (data === 'delete_feedback') {
          const feedbacks = await this.feedbackService.findAll();
          const keyboard: TelegramBot.InlineKeyboardButton[][] = feedbacks.map((fb) => [
            { text: `📋 ID: ${fb.id}, ${language === 'uz' ? 'Reyting' : 'Рейтинг'}: ${fb.rating}`, callback_data: `delete_fb_${fb.id}` },
          ]);
          const message = language === 'uz' ? '🗑 O‘chiriladigan feedbackni tanlang:' : '🗑 Выберите отзыв для удаления:';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { inline_keyboard: keyboard } });
        } else if (data.startsWith('delete_fb_')) {
          const feedbackId = parseInt(data.split('_')[2]);
          await this.feedbackService.remove(feedbackId);
          const message = language === 'uz' ? '✅ Feedback o‘chirildi.' : '✅ Отзыв удален.';
          await this.telegramService.sendMessage(chatId, message, {
            reply_markup: getAdminKeyboard(language),
          });
        } else if (data === 'create_promocode') {
          const message = language === 'uz'
            ? '🎟 Promo-kod ma‘lumotlarini kiriting (kod;foiz;amal qilish muddati yyyy-mm-dd):'
            : '🎟 Введите данные промокода (код;процент;срок действия yyyy-mm-dd):';
          await this.telegramService.sendMessage(chatId, message, { reply_markup: { force_reply: true } });
          bot.once('message', async (msg) => {
            try {
              const [code, discountPercent, expiryDate] = msg.text.split(';');
              await this.promocodeService.create({
                code: code.trim(),
                discountPercent: parseFloat(discountPercent.trim()),
                validTill: new Date(expiryDate.trim()),
              });
              const successMessage = language === 'uz' ? '✅ Promo-kod qo‘shildi.' : '✅ Промокод добавлен.';
              await this.telegramService.sendMessage(chatId, successMessage, {
                reply_markup: getAdminKeyboard(language),
              });
            } catch (error) {
              this.logger.error(`Error in create_promocode: ${error.message}`);
              const errorMessage = language === 'uz' ? '❌ Promo-kod qo‘shishda xato yuz berdi.' : '❌ Ошибка при добавлении промокода.';
              await this.telegramService.sendMessage(chatId, errorMessage);
            }
          });
        } else if (data === 'view_stats') {
          const totalUsers = await this.userService.findAll();
          const totalOrders = await this.orderService.findAll();
          const totalRevenue = totalOrders.reduce((sum, order) => sum + order.totalAmount, 0);
          await this.telegramService.sendMessage(chatId, formatStats({ totalUsers: totalUsers.length, totalOrders: totalOrders.length, totalRevenue }, language), {
            parse_mode: 'HTML',
            reply_markup: getAdminKeyboard(language),
          });
        }
      } catch (error) {
        this.logger.error(`Error in callback: ${error.message}`);
        const message = language === 'uz' ? '❌ Xatolik yuz berdi, iltimos keyinroq urinib ko‘ring.' : '❌ Произошла ошибка, попробуйте позже.';
        await this.telegramService.sendMessage(chatId, message);
      }
    });
  }
}