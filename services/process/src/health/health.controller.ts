import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, MessagePattern, NatsContext, Payload } from "@nestjs/microservices";
import { ACTIONS } from "@part-iot/common";

@Controller("health")
export class HealthController {
	private readonly logger = new Logger(HealthController.name);

	@MessagePattern(ACTIONS.PROCESS.HEALTH)
	checkHealth(@Payload() data: any, @Ctx() context: NatsContext) {
		this.logger.log(`Received health check from API Gateway. Data: ${JSON.stringify(data)}`);
		return { status: "ok", service: "process", timestamp: new Date().toISOString() };
	}
}
