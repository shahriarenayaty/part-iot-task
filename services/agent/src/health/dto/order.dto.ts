import { IsString } from "class-validator";

export class OrderDTO {
	@IsString()
	orderId: string;
}
