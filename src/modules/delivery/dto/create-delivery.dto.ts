export class CreateDeliveryDto {
  orderId: number;
  latitude: number;
// authentication xatosi tuzatildi
  longitude: number;
// kod formatlash va tozalash
  addressDetails?: string;
}