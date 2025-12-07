import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { NATS_BROKER } from "../utils/consts";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout } from "rxjs";
import {EVENTS} from "@part-iot/common"

@Injectable()
export class HealthService {
	constructor(@Inject(NATS_BROKER) private readonly natsClient: ClientProxy) {}
	async checkHealth() {
		try {
			const agentResponse = await firstValueFrom(
				this.natsClient.send("health.check", { from: "api-gateway" }).pipe(timeout(2000)),
			);
			this.natsClient.emit(EVENTS.ORDER.CREATED, { orderId: 123, status: "created" });

			return {
				api_gateway: "ok",
				agent_service: agentResponse, // The response from the Agent
			};
		} catch (error) {
			// If message times out or fails, we assume Agent is down
			throw new HttpException(
				{
					api_gateway: "ok",
					agent_service: "down",
					error: error.message,
				},
				HttpStatus.SERVICE_UNAVAILABLE,
			);
		}
	}
}
