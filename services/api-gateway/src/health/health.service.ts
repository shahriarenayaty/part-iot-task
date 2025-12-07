import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { NATS_BROKER } from "../utils/consts";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout } from "rxjs";
import { ACTIONS, EVENTS } from "@part-iot/common";

@Injectable()
export class HealthService {
	constructor(@Inject(NATS_BROKER) private readonly natsClient: ClientProxy) {}
	async checkHealth() {
		const [agentStatus, processStatus] = await Promise.all([
			this.checkServiceHealth(ACTIONS.AGENT.HEALTH),
			this.checkServiceHealth(ACTIONS.PROCESS.HEALTH),
		]);

		const response = {
			api_gateway: "ok",
			agent_service: agentStatus,
			process_service: processStatus,
		};

		if (agentStatus.status === "down" || processStatus.status === "down") {
			throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
		}

		return response;
	}

	private async checkServiceHealth(action: string) {
		try {
			return await firstValueFrom(
				this.natsClient.send(action, { from: "api-gateway" }).pipe(timeout(2000)),
			);
		} catch (error) {
			return {
				status: "down",
				error: error.message,
			};
		}
	}
}
