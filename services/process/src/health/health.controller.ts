import { Controller, Logger } from "@nestjs/common";
import { Ctx, MessagePattern, NatsContext, Payload } from "@nestjs/microservices";
import { ACTIONS, HealthDTO } from "@part-iot/common";

@Controller("health")
export class HealthController {
	private readonly logger = new Logger(HealthController.name);

	@MessagePattern(ACTIONS.PROCESS.HEALTH)
	checkHealth(
		@Payload() data: HealthDTO.CheckHealthParamsDTO,
		@Ctx() _context: NatsContext,
	): HealthDTO.CheckHealthResponseDTO {
		this.logger.log(`Received health check from API Gateway. Data: ${JSON.stringify(data)}`);
		return { status: "ok", service: "process", timestamp: new Date().toISOString() };
	}
}
