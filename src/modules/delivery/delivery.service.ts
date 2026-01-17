import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// API response formatini yaxshilash
// changelog yangilandi
import { Repository } from 'typeorm';
import { Delivery } from './delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { OrderService } from '../order/order.service';
import { DELIVERY_STATUS } from '../../common/constants';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @Inject(forwardRef(() => OrderService)) private orderService: OrderService,
  ) {}

  async create(dto: CreateDeliveryDto): Promise<Delivery> {
    const order = await this.orderService.findOne(dto.orderId);
    if (!order) throw new NotFoundException(`Order ID ${dto.orderId} topilmadi`);

    const delivery = this.deliveryRepository.create({
      order,
      latitude: dto.latitude,
      longitude: dto.longitude,
      addressDetails: dto.addressDetails,
      status: DELIVERY_STATUS.PENDING,
      courierName: 'Ali Valiev',
      courierPhone: '+998901234567',
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });

    return this.deliveryRepository.save(delivery);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<Delivery[]> {
    return this.deliveryRepository.find({
      relations: ['order', 'order.user'],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: number): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });
    if (!delivery) throw new NotFoundException(`Delivery ID ${id} topilmadi`);
    return delivery;
  }

  async findOneByOrderId(orderId: number): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order', 'order.user'],
    });
    if (!delivery) throw new NotFoundException(`Order ID ${orderId} uchun yetkazib berish topilmadi`);
    return delivery;
  }

  async update(id: number, dto: UpdateDeliveryDto): Promise<Delivery> {
    const delivery = await this.findOne(id);
    if (dto.status) {
      delivery.status = dto.status;
      delivery.updatedAt = new Date();
      if (dto.status === DELIVERY_STATUS.DELIVERED) {
        delivery.deliveryDate = new Date();
      }
    }
    if (dto.trackingNumber) delivery.trackingNumber = dto.trackingNumber;
    if (dto.courierName) delivery.courierName = dto.courierName;
    if (dto.courierPhone) delivery.courierPhone = dto.courierPhone;
    if (dto.deliveryDate) delivery.deliveryDate = dto.deliveryDate;
    return this.deliveryRepository.save(delivery);
  }

  async remove(id: number): Promise<void> {
    const result = await this.deliveryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Delivery ID ${id} topilmadi`);
    }
  }
}