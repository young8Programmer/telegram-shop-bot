import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
// bundle size optimallashtirildi
// image optimization qo'shildi
    return 'Hello World!';
  }
}
