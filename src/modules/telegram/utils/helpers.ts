import { Category } from '../../category/category.entity';
import { Product } from '../../product/product.entity';
import { User } from '../../user/user.entity';
import { Order } from '../../order/order.entity';
import { Feedback } from '../../feedback/feedback.entity';
import { Delivery } from '../../delivery/delivery.entity';

export function formatProductMessage(product: Product, language: string): string {
  return language === 'uz'
    ? `📦 ${product.name}\n💵 Narxi: ${product.price} so‘m\n📝 Tavsifi: ${product.description}\n📋 Kategoriya: ${product.category?.name || 'N/A'}\n🏬 Ombordagi soni: ${product.stock}`
    : `📦 ${product.name}\n💵 Цена: ${product.price} сум\n📝 Описание: ${product.description}\n📋 Категория: ${product.category?.name || 'N/A'}\n🏬 Количество на складе: ${product.stock}`;
}

export function formatCategoryList(categories: Category[], language: string): string {
  if (!categories.length) {
    return language === 'uz' ? 'Kategoriyalar mavjud emas.' : 'Категории отсутствуют.';
  }
  return categories
    .map(
      (cat, index) =>
        `<b>${index + 1}. ${cat.name}</b>\n${language === 'uz' ? 'Tavsifi' : 'Описание'}: ${cat.description || 'N/A'}\n`,
    )
    .join('\n');
}

export function formatProductList(products: Product[], language: string): string {
  if (!products.length) {
    return language === 'uz' ? 'Mahsulotlar mavjud emas.' : 'Товары отсутствуют.';
  }
  return products
    .map(
      (prod, index) =>
        `<b>${index + 1}. ${prod.name}</b>\n` +
        `${language === 'uz' ? 'Narxi' : 'Цена'}: ${prod.price} ${language === 'uz' ? 'so‘m' : 'сум'}\n` +
        `${language === 'uz' ? 'Tavsifi' : 'Описание'}: ${prod.description || 'N/A'}\n` +
        `${language === 'uz' ? 'Kategoriya' : 'Категория'}: ${prod.category?.name || 'N/A'}\n` +
        `${language === 'uz' ? 'Ombordagi soni' : 'Количество на складе'}: ${prod.stock}\n`,
    )
    .join('\n');
}

export function formatUserList(users: User[], language: string): string {
  if (!users.length) {
    return language === 'uz' ? 'Foydalanuvchilar mavjud emas.' : 'Пользователи отсутствуют.';
  }
  return users
    .map(
      (user, index) =>
        `<b>${index + 1}. ${user.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}</b>\n` +
        `Telegram ID: ${user.telegramId}\n` +
        `${language === 'uz' ? 'Telefon' : 'Телефон'}: ${user.phone || 'N/A'}\n` +
        `${language === 'uz' ? 'Admin' : 'Админ'}: ${user.isAdmin ? (language === 'uz' ? 'Ha' : 'Да') : language === 'uz' ? 'Yo‘q' : 'Нет'}\n`,
    )
    .join('\n');
}

export function formatOrderList(orders: Order[], language: string): string {
  if (!orders.length) {
    return language === 'uz' ? 'Buyurtmalar mavjud emas.' : 'Заказы отсутствуют.';
  }
  return orders
    .map(
      (order, index) =>
        `<b>${index + 1}. ${language === 'uz' ? 'Buyurtma' : 'Заказ'} #${order.id}</b>\n` +
        `${language === 'uz' ? 'Foydalanuvchi' : 'Пользователь'}: ${order.user?.fullName || 'N/A'}\n` +
        `${language === 'uz' ? 'Mahsulotlar' : 'Товары'}: ${order.orderItems
          ?.map((item) => `${item.product.name} - ${item.quantity} ${language === 'uz' ? 'dona' : 'шт.'}`)
          .join(', ') || 'N/A'}\n` +
        `${language === 'uz' ? 'Jami' : 'Итого'}: ${order.totalAmount} ${language === 'uz' ? 'so‘m' : 'сум'}\n` +
        `${language === 'uz' ? 'Status' : 'Статус'}: ${order.status}\n` +
        `${language === 'uz' ? 'To‘lov turi' : 'Тип оплаты'}: ${order.paymentType || 'N/A'}\n`,
    )
    .join('\n');
}

export function formatFeedbackList(feedbacks: Feedback[], language: string): string {
  if (!feedbacks.length) {
    return language === 'uz' ? 'Feedbacklar mavjud emas.' : 'Отзывы отсутствуют.';
  }
  return feedbacks
    .map(
      (fb, index) =>
        `<b>${index + 1}. Feedback #${fb.id}</b>\n` +
        `${language === 'uz' ? 'Mahsulot' : 'Товар'}: ${fb.product?.name || 'N/A'}\n` +
        `${language === 'uz' ? 'Foydalanuvchi' : 'Пользователь'}: ${fb.user?.fullName || 'N/A'}\n` +
        `${language === 'uz' ? 'Reyting' : 'Рейтинг'}: ${fb.rating}\n` +
        `${language === 'uz' ? 'Izoh' : 'Комментарий'}: ${fb.comment || 'N/A'}\n`,
    )
    .join('\n');
}

export function formatDeliveryList(deliveries: Delivery[], language: string): string {
  if (!deliveries.length) {
    return language === 'uz' ? 'Yetkazib berishlar mavjud emas.' : 'Доставки отсутствуют.';
  }
  return deliveries
    .map(
      (delivery, index) =>
        `<b>${index + 1}. ${language === 'uz' ? 'Yetkazib berish' : 'Доставка'} #${delivery.id}</b>\n` +
        `${language === 'uz' ? 'Buyurtma ID' : 'ID заказа'}: ${delivery.order.id}\n` +
        `${language === 'uz' ? 'Manzil' : 'Адрес'}: (${delivery.latitude}, ${delivery.longitude})\n` +
        `${language === 'uz' ? 'Qo‘shimcha' : 'Дополнительно'}: ${delivery.addressDetails || 'N/A'}\n` +
        `${language === 'uz' ? 'Status' : 'Статус'}: ${delivery.status}\n` +
        `${language === 'uz' ? 'Kuryer' : 'Курьер'}: ${delivery.courierName || 'N/A'}\n` +
        `${language === 'uz' ? 'Telefon' : 'Телефон'}: ${delivery.courierPhone || 'N/A'}\n` +
        `${language === 'uz' ? 'Sana' : 'Дата'}: ${delivery.deliveryDate?.toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU') || 'N/A'}\n`,
    )
    .join('\n');
}

export function formatStats(stats: { totalUsers: number; totalOrders: number; totalRevenue: number }, language: string): string {
  return language === 'uz'
    ? `<b>📊 Statistika</b>\n` +
      `👥 Foydalanuvchilar soni: ${stats.totalUsers}\n` +
      `🛍 Buyurtmalar soni: ${stats.totalOrders}\n` +
      `💸 Umumiy daromad: ${stats.totalRevenue} so‘m`
    : `<b>📊 Статистика</b>\n` +
      `👥 Количество пользователей: ${stats.totalUsers}\n` +
      `🛍 Количество заказов: ${stats.totalOrders}\n` +
      `💸 Общий доход: ${stats.totalRevenue} сум`;
}