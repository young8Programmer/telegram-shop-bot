import { TelegramBot } from 'node-telegram-bot-api';
import { KeyboardOptions } from './interfaces';

export function getMainKeyboard(showContact: boolean, language: string = 'uz'): TelegramBot.SendMessageOptions['reply_markup'] {
  const keyboard: TelegramBot.KeyboardButton[][] = [
    [
      { text: language === 'uz' ? '📁 Kategoriyalar' : '📁 Категории' },
      { text: language === 'uz' ? '🛒 Savatcha' : '🛒 Корзина' },
    ],
    [
      { text: language === 'uz' ? '👤 Profilim' : '👤 Мой профиль' },
      { text: language === 'uz' ? '🕘 Buyurtma tarixi' : '🕘 История заказов' },
    ],
    [
      { text: language === 'uz' ? 'ℹ️ Biz haqimizda' : 'ℹ️ О нас' },
      { text: language === 'uz' ? '🆘 Yordam' : '🆘 Помощь' },
    ],
  ];

  if (showContact) {
    keyboard.unshift([
      { text: language === 'uz' ? '📞 Telefon raqamni yuborish' : '📞 Отправить номер телефона', request_contact: true },
    ]);
  }

  return {
    keyboard,
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

export function getAdminKeyboard(language: string = 'uz'): TelegramBot.SendMessageOptions['reply_markup'] {
  return {
    inline_keyboard: [
      [
        { text: language === 'uz' ? '📋 Kategoriyalarni ko‘rish' : '📋 Посмотреть категории', callback_data: 'view_categories' },
        { text: language === 'uz' ? '➕ Kategoriya qo‘shish' : '➕ Добавить категорию', callback_data: 'add_category' },
        { text: language === 'uz' ? '✏️ Kategoriya tahrirlash' : '✏️ Редактировать категорию', callback_data: 'edit_category' },
        { text: language === 'uz' ? '🗑️ Kategoriya o‘chirish' : '🗑️ Удалить категорию', callback_data: 'delete_category' },
      ],
      [
        { text: language === 'uz' ? '📋 Mahsulotlarni ko‘rish' : '📋 Посмотреть товары', callback_data: 'view_products' },
        { text: language === 'uz' ? '➕ Mahsulot qo‘shish' : '➕ Добавить товар', callback_data: 'add_product' },
        { text: language === 'uz' ? '✏️ Mahsulot tahrirlash' : '✏️ Редактировать товар', callback_data: 'edit_product' },
        { text: language === 'uz' ? '🗑️ Mahsulot o‘chirish' : '🗑️ Удалить товар', callback_data: 'delete_product' },
      ],
      [
        { text: language === 'uz' ? '👥 Foydalanuvchilarni ko‘rish' : '👥 Посмотреть пользователей', callback_data: 'view_users' },
        { text: language === 'uz' ? '✏️ Foydalanuvchi tahrirlash' : '✏️ Редактировать пользователя', callback_data: 'edit_user' },
        { text: language === 'uz' ? '🗑️ Foydalanuvchi o‘chirish' : '🗑️ Удалить пользователя', callback_data: 'delete_user' },
      ],
      [
        { text: language === 'uz' ? '📦 Buyurtmalar' : '📦 Заказы', callback_data: 'view_orders' },
        { text: language === 'uz' ? '🚚 Yetkazib berishlar' : '🚚 Доставки', callback_data: 'view_deliveries' },
        { text: language === 'uz' ? '✏️ Yetkazib berish tahrirlash' : '✏️ Редактировать доставку', callback_data: 'edit_delivery' },
      ],
      [
        { text: language === 'uz' ? '🗒️ Feedbacklar' : '🗒️ Отзывы', callback_data: 'view_feedback' },
        { text: language === 'uz' ? '🗑️ Feedback o‘chirish' : '🗑️ Удалить отзыв', callback_data: 'delete_feedback' },
      ],
      [
        { text: language === 'uz' ? '🎟️ Promo-kod yaratish' : '🎟️ Создать промокод', callback_data: 'create_promocode' },
      ],
      [
        { text: language === 'uz' ? '📊 Statistika' : '📊 Статистика', callback_data: 'view_stats' },
      ],
    ],
  };
}