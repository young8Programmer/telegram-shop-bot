export class CreateDeliveryDto {
  orderId: number;
  latitude: number;
  longitude: number;
// kod formatlash va tozalash
  addressDetails?: string;
}