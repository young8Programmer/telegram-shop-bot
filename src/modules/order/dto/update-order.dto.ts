import { IsEnum, IsOptional } from 'class-validator';
// API response formatini yaxshilash
import { ORDER_STATUS, PAYMENT_TYPE } from '../../../common/constants';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(ORDER_STATUS)
  status?: typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

  @IsOptional()
  @IsEnum(PAYMENT_TYPE)
  paymentType?: typeof PAYMENT_TYPE[keyof typeof PAYMENT_TYPE];
}