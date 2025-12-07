import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ACTIONS } from "@part-iot/common";
import { firstValueFrom, timeout } from "rxjs";

import { NATS_BROKER } from "../utils/consts";
import { HealthResDTO, ServiceHealthCheckDTO } from "./dto/res.dto";

@Injectable()
export class HealthService {
	constructor(@Inject(NATS_BROKER) private readonly natsClient: ClientProxy) {}
	async checkHealth(): Promise<HealthResDTO> {
		const [agentStatus, processStatus] = await Promise.all([
			this.checkServiceHealth(ACTIONS.AGENT.HEALTH),
			this.checkServiceHealth(ACTIONS.PROCESS.HEALTH),
		]);

		const response: HealthResDTO = {
			api_gateway: "ok",
			agent_service: agentStatus,
			process_service: processStatus,
		};

		if (agentStatus.status === "down" || processStatus.status === "down") {
			throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
		}

		return response;
	}

	private async checkServiceHealth(action: string): Promise<ServiceHealthCheckDTO> {
		try {
			return await firstValueFrom(
				this.natsClient
					.send<ServiceHealthCheckDTO>(action, { from: "api-gateway" })
					.pipe(timeout(2000)),
			);
		} catch (error) {
			return {
				status: "down",
				error: error.message,
			};
		}
	}
}
