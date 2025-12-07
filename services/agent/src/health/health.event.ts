import { EventSubscriber, OnEvent } from "../decorators";

@EventSubscriber()
export class HealthEvent {
	@OnEvent("order.created")
	async handleMediaProgressUpdate(payload: unknown): Promise<void> {
        throw new Error("Simulated processing error in HealthEvent");
	}
}
