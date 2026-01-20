import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import * as TelegramBot from 'node-telegram-bot-api';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}
// database querylarni optimallashtirish
// user authentication qo'shildi

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() update: TelegramBot.Update) {
    await this.telegramService.handleWebhookUpdate(update);
    return {};
  }
}