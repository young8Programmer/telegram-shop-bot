// build konfiguratsiyasi sozlandi
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
// CORS xatosi tuzatildi
import { Category } from '../category/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException(`Category ID ${dto.categoryId} topilmadi`);
    }

    const product = this.productRepository.create({
      ...dto,
      category,
      createdAt: new Date(),
    });

    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.productRepository.find({ relations: ['category'] });
    } catch (error) {
      throw new Error('Mahsulotlarni olishda xato yuz berdi');
    }
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id }, relations: ['category'] });
    if (!product) {
      throw new NotFoundException(`ID ${id} bo'yicha mahsulot topilmadi`);
    }
    return product;
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
  const products = await this.productRepository.find({
    where: { category: { id: categoryId } },
    relations: ['category'],
  });

  products.forEach(prod => {
    console.log(`Product: ${prod.name}, nameRu: ${prod.nameRu}`);
  });

  return products;
}

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const result = await this.productRepository.update(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha mahsulot topilmadi`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha mahsulot topilmadi`);
    }
  }
}