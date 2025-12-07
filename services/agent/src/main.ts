// agent/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";

async function bootstrap() {
	const logger = new Logger("AgentService");
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
		transport: Transport.NATS,
		options: {
			servers: [process.env.NATS_URL || "nats://localhost:4222"],
			// Queue group ensures only one instance handles the request if you scale up
			queue: "agent_health_queue",
		},
	});

	await app.listen();

	logger.log("Agent Service is listening on NATS...");
}
bootstrap();
