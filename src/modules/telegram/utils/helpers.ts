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
  const name = language === 'uz' ? product.name : product.nameRu || product.name;
  const description = language === 'uz' ? product.description : product.descriptionRu || product.description;
  return [
    `<b>${name || (language === 'uz' ? 'Nomi kiritilmagan' : 'Название не указано')}</b>`,
    `${description || (language === 'uz' ? 'Tavsif yo‘q' : 'Описание отсутствует')}`,
    `<b>${language === 'uz' ? 'Narxi' : 'Цена'}</b>: ${product.price} so‘m`,
    `<b>${language === 'uz' ? 'Omborda' : 'На складе'}</b>: ${product.stock} ${language === 'uz' ? 'dona' : 'шт.'}`,
  ].join('\n');
}

export function formatCategoryList(categories: Category[], language: string = 'uz'): string {
  if (!categories.length) return language === 'uz' ? '❌ Kategoriyalar mavjud emas.' : '❌ Категории отсутствуют.';
  return categories
    .map((cat) => [
      `<b>${language === 'uz' ? 'ID' : 'ID'}</b>: ${cat.id}`,
      `<b>${language === 'uz' ? 'Nomi' : 'Название'}</b>: ${language === 'uz' ? cat.name : cat.nameRu || cat.name || (language === 'uz' ? 'Nomi kiritilmagan' : 'Название не указано')}`,
      `<b>${language === 'uz' ? 'Tavsif' : 'Описание'}</b>: ${language === 'uz' ? cat.description : cat.descriptionRu || cat.description || (language === 'uz' ? 'Tavsif yo‘q' : 'Описание отсутствует')}`,
    ].join('\n'))
    .join('\n\n');
}

export function formatProductList(products: Product[], language: string = 'uz'): string {
  if (!products.length) return language === 'uz' ? '❌ Mahsulotlar mavjud emas.' : '❌ Товары отсутствуют.';
  const availableProducts = products.filter(prod => prod.stock > 0);
  if (!availableProducts.length) return language === 'uz' ? '❌ Omborda mahsulotlar mavjud emas.' : '❌ На складе нет товаров.';
  return availableProducts
    .map((prod) => [
      `<b>${language === 'uz' ? 'ID' : 'ID'}</b>: ${prod.id}`,
      `<b>${language === 'uz' ? 'Nomi' : 'Название'}</b>: ${language === 'uz' ? prod.name : prod.nameRu || prod.name || (language === 'uz' ? 'Nomi kiritilmagan' : 'Название не указано')}`,
      `<b>${language === 'uz' ? 'Narxi' : 'Цена'}</b>: ${prod.price} so‘m`,
      `<b>${language === 'uz' ? 'Kategoriya' : 'Категория'}</b>: ${language === 'uz' ? (prod.category?.name || 'N/A') : (prod.category?.nameRu || prod.category?.name || 'N/A')}`,
      `<b>${language === 'uz' ? 'Omborda' : 'На складе'}</b>: ${prod.stock} ${language === 'uz' ? 'dona' : 'шт.'}`,
    ].join('\n'))
    .join('\n\n');
}

export function formatUserList(users: User[], language: string = 'uz'): string {
  if (!users.length) return language === 'uz' ? '❌ Foydalanuvchilar mavjud emas.' : '❌ Пользователи отсутствуют.';
  return users
    .map((user) => [
      `<b>${language === 'uz' ? 'ID' : 'ID'}</b>: ${user.id}`,
      `<b>${language === 'uz' ? 'Ism' : 'Имя'}</b>: ${user.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}`,
      `<b>${language === 'uz' ? 'Telefon' : 'Телефон'}</b>: ${user.phone || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}`,
      `<b>Telegram ID</b>: ${user.telegramId}`,
      `<b>${language === 'uz' ? 'Admin' : 'Админ'}</b>: ${user.isAdmin ? (language === 'uz' ? '✅ Ha' : '✅ Да') : (language === 'uz' ? '❌ Yo‘q' : '❌ Нет')}`,
    ].join('\n'))
    .join('\n\n');
}

export function formatFeedbackList(feedbacks: Feedback[], language: string = 'uz'): string {
  if (!feedbacks.length) return language === 'uz' ? '❌ Feedbacklar mavjud emas.' : '❌ Отзывы отсутствуют.';
  return feedbacks
    .map((fb) => [
      `<b>${language === 'uz' ? 'ID' : 'ID'}</b>: ${fb.id}`,
      `<b>${language === 'uz' ? 'Mahsulot' : 'Товар'}</b>: ${language === 'uz' ? fb.product.name : fb.product.nameRu || fb.product.name}`,
      `<b>${language === 'uz' ? 'Foydalanuvchi' : 'Пользователь'}</b>: ${fb.user?.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}`,
      `<b>${language === 'uz' ? 'Reyting' : 'Рейтинг'}</b>: ${fb.rating}`,
      `<b>${language === 'uz' ? 'Izoh' : 'Комментарий'}</b>: ${fb.comment || (language === 'uz' ? 'Yo‘q' : 'Отсутствует')}`,
    ].join('\n'))
    .join('\n\n');
}

export function formatOrderList(orders: Order[], language: string = 'uz'): string {
  if (!orders.length) return language === 'uz' ? '❌ Buyurtmalar mavjud emas.' : '❌ Заказы отсутствуют.';
  return orders
    .map((order) => {
      const items = order.orderItems?.map((item) =>
        `${language === 'uz' ? item.product.name : item.product.nameRu || item.product.name} - ${item.quantity} ${language === 'uz' ? 'dona' : 'шт.'}`
      ).join(', ') || 'N/A';
      const delivery = order.deliveries && order.deliveries.length > 0
        ? [
            `<b>${language === 'uz' ? 'Manzil' : 'Адрес'}</b>: (${order.deliveries[0].latitude}, ${order.deliveries[0].longitude})`,
            `<b>${language === 'uz' ? 'Qo‘shimcha' : 'Дополнительно'}</b>: ${order.deliveries[0].addressDetails || 'N/A'}`,
            `<b>${language === 'uz' ? 'Yetkazib berish statusi' : 'Статус доставки'}</b>: ${order.deliveries[0].status || 'N/A'}`,
            `<b>${language === 'uz' ? 'Yetkazib beruvchi' : 'Курьер'}</b>: ${order.deliveries[0].courierName || 'N/A'}`,
            `<b>${language === 'uz' ? 'Telefon' : 'Телефон'}</b>: ${order.deliveries[0].courierPhone || 'N/A'}`,
            `<b>${language === 'uz' ? 'Yetkazib berish sanasi' : 'Дата доставки'}</b>: ${order.deliveries[0].deliveryDate?.toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU') || 'N/A'}`,
          ].join('\n')
        : language === 'uz' ? '❌ Yetkazib berish ma‘lumotlari yo‘q' : '❌ Данные о доставке отсутствуют';

      return [
        `<b>${language === 'uz' ? 'Buyurtma' : 'Заказ'} #${order.id}</b>`,
        `<b>${language === 'uz' ? 'Foydalanuvchi' : 'Пользователь'}</b>: ${order.user?.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}`,
        `<b>${language === 'uz' ? 'Jami' : 'Итого'}</b>: ${order.totalAmount} so‘m`,
        `<b>${language === 'uz' ? 'Status' : 'Статус'}</b>: ${order.status}`,
        `<b>${language === 'uz' ? 'To‘lov turi' : 'Тип оплаты'}</b>: ${order.paymentType || (language === 'uz' ? 'To‘lanmagan' : 'Не оплачен')}`,
        `<b>${language === 'uz' ? 'Mahsulotlar' : 'Товары'}</b>: ${items}`,
        delivery,
        `━━━━━━━━━━━━━━━`,
      ].join('\n');
    })
    .join('\n\n');
}

export function formatDeliveryList(deliveries: Delivery[], language: string = 'uz'): string {
  if (!deliveries.length) return language === 'uz' ? '❌ Yetkazib berishlar mavjud emas.' : '❌ Доставки отсутствуют.';
  return deliveries
    .map((delivery) => [
      `<b>${language === 'uz' ? 'Yetkazib berish' : 'Доставка'} #${delivery.id}</b>`,
      `<b>${language === 'uz' ? 'Buyurtma ID' : 'ID заказа'}</b>: ${delivery.order.id}`,
      `<b>${language === 'uz' ? 'Foydalanuvchi' : 'Пользователь'}</b>: ${delivery.order.user?.fullName || (language === 'uz' ? 'Kiritilmagan' : 'Не указано')}`,
      `<b>${language === 'uz' ? 'Manzil' : 'Адрес'}</b>: (${delivery.latitude}, ${delivery.longitude})`,
      `<b>${language === 'uz' ? 'Qo‘shimcha' : 'Дополнительно'}</b>: ${delivery.addressDetails || 'N/A'}`,
      `<b>${language === 'uz' ? 'Status' : 'Статус'}</b>: ${delivery.status}`,
      `<b>${language === 'uz' ? 'Yetkazib beruvchi' : 'Курьер'}</b>: ${delivery.courierName || 'N/A'}`,
      `<b>${language === 'uz' ? 'Telefon' : 'Телефон'}</b>: ${delivery.courierPhone || 'N/A'}`,
      `<b>${language === 'uz' ? 'Yetkazib berish sanasi' : 'Дата доставки'}</b>: ${delivery.deliveryDate?.toLocaleString(language === 'uz' ? 'uz-UZ' : 'ru-RU') || 'N/A'}`,
      `<b>${language === 'uz' ? 'Kuzatuv raqami' : 'Номер отслеживания'}</b>: ${delivery.trackingNumber || 'N/A'}`,
      `━━━━━━━━━━━━━━━`,
    ].join('\n'))
    .join('\n\n');
}

export function formatStats(stats: any, language: string = 'uz'): string {
  const monthlyStats = Object.entries(stats.monthlyStats || {}).map(([month, amount]) => `📆 ${month}: ${amount} so‘m`).join('\n') || (language === 'uz' ? 'Ma’lumot yo‘q' : 'Нет данных');
  const yearlyStats = Object.entries(stats.yearlyStats || {}).map(([year, amount]) => `📆 ${year}: ${amount} so‘m`).join('\n') || (language === 'uz' ? 'Ma’lumot yo‘q' : 'Нет данных');

  return [
    `<b>${language === 'uz' ? 'Statistika' : 'Статистика'}</b>`,
    `━━━━━━━━━━━━━━━`,
    `<b>${language === 'uz' ? 'Jami buyurtmalar' : 'Всего заказов'}</b>: ${stats.totalOrders}`,
    `<b>${language === 'uz' ? 'Jami summa (to‘langan)' : 'Общая сумма (оплачено)'}</b>: ${stats.totalAmount} so‘m`,
    `<b>${language === 'uz' ? 'Kutayotgan buyurtmalar' : 'Ожидающие заказы'}</b>: ${stats.pendingOrders}`,
    `<b>${language === 'uz' ? 'To‘langan buyurtmalar' : 'Оплаченные заказы'}</b>: ${stats.paidOrders}`,
    `<b>${language === 'uz' ? 'Yetkazib berilayotgan' : 'В доставке'}</b>: ${stats.shippedOrders}`,
    `<b>${language === 'uz' ? 'Yetkazib berilgan' : 'Доставленные'}</b>: ${stats.deliveredOrders}`,
    `<b>${language === 'uz' ? 'Bekor qilingan' : 'Отмененные'}</b>: ${stats.cancelledOrders}`,
    `<b>${language === 'uz' ? 'Sotilgan mahsulotlar' : 'Проданные товары'}</b>: ${stats.soldProducts}`,
    `<b>${language === 'uz' ? 'Savatchadagi mahsulotlar' : 'Товары в корзине'}</b>: ${stats.cartItems}`,
    `━━━━━━━━━━━━━━━`,
    `<b>${language === 'uz' ? 'Oylik hisobot (to‘langan)' : 'Месячный отчет (оплачено)'}</b>:`,
    monthlyStats,
    `━━━━━━━━━━━━━━━`,
    `<b>${language === 'uz' ? 'Yillik hisobot (to‘langan)' : 'Годовой отчет (оплачено)'}</b>:`,
    yearlyStats,
    `━━━━━━━━━━━━━━━`,
  ].join('\n');
}