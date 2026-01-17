import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
// image optimization qo'shildi
    return 'Hello World!';
  }
}
