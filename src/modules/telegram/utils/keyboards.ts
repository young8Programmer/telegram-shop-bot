import * as TelegramBot from 'node-telegram-bot-api';

export function getMainKeyboard(needPhone: boolean, language: string): TelegramBot.ReplyKeyboardMarkup {
  const buttons = language === 'uz'
    ? [
        ['📁 Kategoriyalar', '🛒 Savatcha'],
        ['👤 Profilim', '🕘 Buyurtma tarixi'],
        ['ℹ️ Biz haqimizda', '🆘 Yordam'],
      ]
    : [
        ['📁 Категории', '🛒 Корзина'],
        ['👤 Мой профиль', '🕘 История заказов'],
        ['ℹ️ О нас', '🆘 Помощь'],
      ];

  if (needPhone) {
    buttons.push([
      language === 'uz' ? '📞 Telefon raqamni yuborish' : '📞 Отправить номер телефона',
    ]);
  }

  return {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: needPhone,
  };
}

export function getAdminKeyboard(language: string): TelegramBot.ReplyKeyboardMarkup {
  const buttons = language === 'uz'
    ? [
        ['📁 Kategoriyalarni boshqarish'],
        ['📦 Mahsulotlarni boshqarish'],
        ['👥 Foydalanuvchilar'],
        ['🛍 Buyurtmalar'],
        ['🚚 Yetkazib berish'],
        ['⭐ Feedbacklar'],
        ['🎟 Promo-kodlar'],
        ['📊 Statistika'],
      ]
    : [
        ['📁 Управление категориями'],
        ['📦 Управление товарами'],
        ['👥 Пользователи'],
        ['🛍 Заказы'],
        ['🚚 Доставка'],
        ['⭐ Отзывы'],
        ['🎟 Промокоды'],
        ['📊 Статистика'],
      ];

  return {
    keyboard: buttons,
    resize_keyboard: true,
  };
}