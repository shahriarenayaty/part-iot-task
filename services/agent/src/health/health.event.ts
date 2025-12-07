import { EventSubscriber, OnEvent, Payload } from "@part-iot/common";
import { OrderDTO } from "./dto/order.dto";

@EventSubscriber()
export class HealthEvent {
	@OnEvent("order.created")
	async handleMediaProgressUpdate(@Payload(OrderDTO) payload: OrderDTO): Promise<void> {
		throw new Error("Simulated processing error in HealthEvent");
	}
}
