import { Category } from "../../category/category.entity";
import { Feedback } from "../../feedback/feedback.entity";
import { Order } from "../../order/order.entity";
import { Product } from "../../product/product.entity";
import { User } from "../../user/user.entity";
import { Delivery } from "../../delivery/delivery.entity";
import { ORDER_STATUS } from "../../../common/constants";

export function formatProductMessage(product: Product, language: string = 'uz'): string {
  if (product.stock === 0) {
    return language === 'uz' ? '❌ Bu mahsulot omborda mavjud emas.' : '❌ Этот товар отсутствует на складе.';
  }
  const name = language === 'uz' ? product.name : product.nameRu;
  const description = language === 'uz' ? product.description : product.descriptionRu;
  return [
    `<b>${name || (language === 'uz' ? 'Nomi kiritilmagan' : 'Название не указано')}</b>`,
    `${description || (language === 'uz' ? 'Tavsif yo‘q' : 'Описание отсутствует')}`,
    `💸 ${language === 'uz' ? 'Narxi' : 'Цена'}: ${product.price} so‘m`,
    `📦 ${language === 'uz' ? 'Omborda' : 'На складе'}: ${product.stock} ${language === 'uz' ? 'dona' : 'шт.'}`,
  ].join('\n');
}

export function formatCategoryList(categories: Category[], language: string = 'uz'): string {
  if (!categories.length) return language === 'uz' ? '❌ Kategoriyalar mavjud emas.' : '❌ Категории отсутствуют.';
  return categories
    .map((cat) => {
      const name = language === 'uz' ? cat.name : cat.nameRu;
      const description = language === 'uz' ? cat.description : cat.descriptionRu;
      return `${language === 'uz' ? '📋 <b>ID</b>' : '📋 <b>ID</b>'}: ${cat.id}, <b>${language === 'uz' ? 'Nomi' : 'Название'}</b>: ${name || (language === 'uz' ? 'Nomi kiritilmagan' : 'Название не указано')}, <b>${language === 'uz' ? 'Tavsif' : 'Описание'}</b>: ${description || (language === 'uz' ? 'Tavsif yo‘q' : 'Описание отсутствует')}`;
    })
    .join('\n');
}

export function formatProductList(products: Product[], language: string = 'uz'): string {
  if (!products.length) return language === 'uz' ? '❌ Mahsulotlar mavjud emas.' : '❌ Товары отсутствуют.';
  const availableProducts = products.filter(prod => prod.stock > 0);
  if (!availableProducts.length) return language === 'uz' ? '❌ Omborda mahsulotlar mavjud emas.' : '❌ На складе нет товаров.';
  return availableProducts
    .map((prod) => {
      const name = language === 'uz' ? prod.name : prod.nameRu;
      const categoryName = language === 'uz' ? (prod.category?.name || 'N/A') : (prod.category?.nameRu || 'N/A');
      return `${language === 'uz' ? '📋 <b>ID</b>' : '📋 <b>ID</b>'}: ${prod.id}, <b>${language === 'uz' ? 'Nomi' : 'Название'}</b>: ${name || (language === 'uz' ? 'Nomi kiritilmagan' : 'Название не указано')}, 💸 <b>${language === 'uz' ? 'Narxi' : 'Цена'}</b>: ${prod.price} so‘m, 📌 <b>${language === 'uz' ? 'Kategoriya' : 'Категория'}</b>: ${categoryName}, 📦 <b>${language === 'uz' ? 'Omborda' : 'На складе'}</b>: ${prod.stock}`;
    })
    .join('\n');
}

export function formatUserList(users: User[], language: string = 'uz'): string {
  if (!users.length) return language === 'uz' ? '❌ Foydalanuvchilar mavjud emas.' : '❌ Пользователи отсутствуют.';
  return users
    .map((user) => `${language === 'uz' ? '👤 <b>ID</b>' : '👤 <b>ID</b>'}: ${user.id}, <b>${language === 'uz' ? 'Ism' : 'Имя'}</b>: ${user.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}, 📞 <b>${language === 'uz' ? 'Telefon' : 'Телефон'}</b>: ${user.phone || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}, 🆔 <b>Telegram ID</b>: ${user.telegramId}, <b>${language === 'uz' ? 'Admin' : 'Админ'}</b>: ${user.isAdmin ? (language === 'uz' ? '✅ Ha' : '✅ Да') : (language === 'uz' ? '❌ Yo‘q' : '❌ Нет')}`)
    .join('\n');
}

export function formatFeedbackList(feedbacks: Feedback[], language: string = 'uz'): string {
  if (!feedbacks.length) return language === 'uz' ? '❌ Feedbacklar mavjud emas.' : '❌ Отзывы отсутствуют.';
  return feedbacks
    .map((fb) => `${language === 'uz' ? '📋 <b>ID</b>' : '📋 <b>ID</b>'}: ${fb.id}, 📦 <b>${language === 'uz' ? 'Mahsulot' : 'Товар'}</b>: ${language === 'uz' ? fb.product.name : fb.product.nameRu || fb.product.name}, 👤 <b>${language === 'uz' ? 'Foydalanuvchi' : 'Пользователь'}</b>: ${fb.user?.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}, ⭐ <b>${language === 'uz' ? 'Reyting' : 'Рейтинг'}</b>: ${fb.rating}, 💬 <b>${language === 'uz' ? 'Izoh' : 'Комментарий'}</b>: ${fb.comment}`)
    .join('\n');
}

export function formatOrderList(orders: Order[], language: string = 'uz'): string {
  if (!orders.length) return language === 'uz' ? '❌ Buyurtmalar mavjud emas.' : '❌ Заказы отсутствуют.';
  return orders
    .map((order) => {
      const items = order.orderItems?.map((item) => `${language === 'uz' ? item.product.name : item.product.nameRu || item.product.name} - ${item.quantity} ${language === 'uz' ? 'dona' : 'шт.'}`).join(', ');
      const delivery = order.deliveries && order.deliveries.length > 0
        ? [
            `${language === 'uz' ? '📍 <b>Manzil</b>' : '📍 <b>Адрес</b>'}: (${order.deliveries[0].latitude}, ${order.deliveries[0].longitude})`,
            `${language === 'uz' ? '🏠 <b>Qo‘shimcha</b>' : '🏠 <b>Дополнительно</b>'}: ${order.deliveries[0].addressDetails || 'N/A'}`,
            `${language === 'uz' ? '📊 <b>Yetkazib berish statusi</b>' : '📊 <b>Статус доставки</b>'}: ${order.deliveries[0].status || 'N/A'}`,
            `${language === 'uz' ? '🚚 <b>Yetkazib beruvchi</b>' : '🚚 <b>Курьер</b>'}: ${order.deliveries[0].courierName || 'N/A'}`,
            `${language === 'uz' ? '📞 <b>Telefon</b>' : '📞 <b>Телефон</b>'}: ${order.deliveries[0].courierPhone || 'N/A'}`,
            `${language === 'uz' ? '📅 <b>Yetkazib berish sanasi</b>' : '📅 <b>Дата доставки</b>'}: ${order.deliveries[0].deliveryDate?.toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU') || 'N/A'}`,
          ].join('\n')
        : language === 'uz' ? '❌ Yetkazib berish ma‘lumotlari yo‘q' : '❌ Данные о доставке отсутствуют';

      return [
        `${language === 'uz' ? '📋 <b>Buyurtma</b>' : '📋 <b>Заказ</b>'} #${order.id}`,
        `${language === 'uz' ? '👤 <b>Foydalanuvchi</b>' : '👤 <b>Пользователь</b>'}: ${order.user?.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}`,
        `${language === 'uz' ? '💸 <b>Jami</b>' : '💸 <b>Итого</b>'}: ${order.totalAmount} so‘m`,
        `${language === 'uz' ? '📊 <b>Status</b>' : '📊 <b>Статус</b>'}: ${order.status}`,
        `${language === 'uz' ? '💵 <b>To‘lov turi</b>' : '💵 <b>Тип оплаты</b>'}: ${order.paymentType || (language === 'uz' ? 'To‘lanmagan' : 'Не оплачен')}`,
        `${language === 'uz' ? '📦 <b>Mahsulotlar</b>' : '📦 <b>Товары</b>'}: ${items || 'N/A'}`,
        delivery,
        `━━━━━━━━━━━━━━━`,
      ].join('\n');
    })
    .join('\n');
}

export function formatDeliveryList(deliveries: Delivery[], language: string = 'uz'): string {
  if (!deliveries.length) return language === 'uz' ? '❌ Yetkazib berishlar mavjud emas.' : '❌ Доставки отсутствуют.';
  return deliveries
    .map((delivery) => {
      return [
        `${language === 'uz' ? '📋 <b>Yetkazib berish</b>' : '📋 <b>Доставка</b>'} #${delivery.id}`,
        `${language === 'uz' ? '📋 <b>Buyurtma ID</b>' : '📋 <b>ID заказа</b>'}: ${delivery.order.id}`,
        `${language === 'uz' ? '👤 <b>Foydalanuvchi</b>' : '👤 <b>Пользователь</b>'}: ${delivery.order.user?.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}`,
        `${language === 'uz' ? '📍 <b>Manzil</b>' : '📍 <b>Адрес</b>'}: (${delivery.latitude}, ${delivery.longitude})`,
        `${language === 'uz' ? '🏠 <b>Qo‘shimcha</b>' : '🏠 <b>Дополнительно</b>'}: ${delivery.addressDetails || 'N/A'}`,
        `${language === 'uz' ? '📊 <b>Status</b>' : '📊 <b>Статус</b>'}: ${delivery.status}`,
        `${language === 'uz' ? '🚚 <b>Yetkazib beruvchi</b>' : '🚚 <b>Курьер</b>'}: ${delivery.courierName || 'N/A'}`,
        `${language === 'uz' ? '📞 <b>Telefon</b>' : '📞 <b>Телефон</b>'}: ${delivery.courierPhone || 'N/A'}`,
        `${language === 'uz' ? '📅 <b>Yetkazib berish sanasi</b>' : '📅 <b>Дата доставки</b>'}: ${delivery.deliveryDate?.toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU') || 'N/A'}`,
        `${language === 'uz' ? '🔍 <b>Kuzatuv raqami</b>' : '🔍 <b>Номер отслеживания</b>'}: ${delivery.trackingNumber || 'N/A'}`,
        `━━━━━━━━━━━━━━━`,
      ].join('\n');
    })
    .join('\n');
}

export function formatStats(stats: any, language: string = 'uz'): string {
  const monthlyStats = Object.entries(stats.monthlyStats || {}).map(([month, amount]) => `📆 ${month}: ${amount} so‘m`).join('\n') || (language === 'uz' ? 'Ma’lumot yo‘q' : 'Нет данных');
  const yearlyStats = Object.entries(stats.yearlyStats || {}).map(([year, amount]) => `📆 ${year}: ${amount} so‘m`).join('\n') || (language === 'uz' ? 'Ma’lumot yo‘q' : 'Нет данных');

  return [
    `${language === 'uz' ? '📊 <b>Statistika</b>' : '📊 <b>Статистика</b>'}`,
    `━━━━━━━━━━━━━━━`,
    `${language === 'uz' ? '📋 <b>Jami buyurtmalar</b>' : '📋 <b>Всего заказов</b>'}: ${stats.totalOrders}`,
    `${language === 'uz' ? '💸 <b>Jami summa (to‘langan)</b>' : '💸 <b>Общая сумма (оплачено)</b>'}: ${stats.totalAmount} so‘m`,
    `${language === 'uz' ? '⏳ <b>Kutayotgan buyurtmalar</b>' : '⏳ <b>Ожидающие заказы</b>'}: ${stats.pendingOrders}`,
    `${language === 'uz' ? '✅ <b>To‘langan buyurtmalar</b>' : '✅ <b>Оплаченные заказы</b>'}: ${stats.paidOrders}`,
    `${language === 'uz' ? '🚚 <b>Yetkazib berilayotgan</b>' : '🚚 <b>В доставке</b>'}: ${stats.shippedOrders}`,
    `${language === 'uz' ? '✔️ <b>Yetkazib berilgan</b>' : '✔️ <b>Доставленные</b>'}: ${stats.deliveredOrders}`,
    `${language === 'uz' ? '❌ <b>Bekor qilingan</b>' : '❌ <b>Отмененные</b>'}: ${stats.cancelledOrders}`,
    `${language === 'uz' ? '📦 <b>Sotilgan mahsulotlar</b>' : '📦 <b>Проданные товары</b>'}: ${stats.soldProducts}`,
    `${language === 'uz' ? '🛒 <b>Savatchadagi mahsulotlar</b>' : '🛒 <b>Товары в корзине</b>'}: ${stats.cartItems}`,
    `━━━━━━━━━━━━━━━`,
    `${language === 'uz' ? '📅 <b>Oylik hisobot (to‘langan)</b>' : '📅 <b>Месячный отчет (оплачено)</b>'}:`,
    monthlyStats,
    `━━━━━━━━━━━━━━━`,
    `${language === 'uz' ? '📅 <b>Yillik hisobot (to‘langan)</b>' : '📅 <b>Годовой отчет (оплачено)</b>'}:`,
    yearlyStats,
    `━━━━━━━━━━━━━━━`,
  ].join('\n');
}