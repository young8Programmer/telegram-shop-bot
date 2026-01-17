import { DELIVERY_STATUS } from '../../../common/constants';
// API endpoints qo'shildi

export class UpdateDeliveryDto {
  status?: typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];
  trackingNumber?: string;
  courierName?: string;
  courierPhone?: string;
  deliveryDate?: Date;
}