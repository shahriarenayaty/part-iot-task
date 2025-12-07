import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, MessagePattern, NatsContext, Payload } from "@nestjs/microservices";

@Controller("health")
export class HealthController {
	private readonly logger = new Logger(HealthController.name);

	@MessagePattern("health.check")
	checkHealth(@Payload() data: any, @Ctx() context: NatsContext) {
		this.logger.log(`Received health check from API Gateway. Data: ${data}`);
		return { status: "ok", service: "agent", timestamp: new Date().toISOString() };
	}
}
