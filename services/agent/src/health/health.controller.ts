import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, NatsContext, Payload } from "@nestjs/microservices";

@Controller("health")
export class HealthController {
	@MessagePattern("health.check")
	checkHealth(@Payload() data: any, @Ctx() context: NatsContext) {
		console.log(`Received health check from API Gateway. Data: ${data}`);
		// Return a simple JSON object confirming status
		return { status: "ok", service: "agent", timestamp: new Date().toISOString() };
	}
}
