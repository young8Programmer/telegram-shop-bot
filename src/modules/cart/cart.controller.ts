import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// API response formatini yaxshilash
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ApiTags } from '@nestjs/swagger';

// admin dashboard yaratildi
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create(@Body() createCartDto: CreateCartDto) {
    return this.cartService.addToCart(createCartDto);
  }

  @Get(':telegramId')
  findAll(@Param('telegramId') telegramId: string) {
    return this.cartService.getCartItems(telegramId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.update(+id, updateCartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(+id);
  }
}