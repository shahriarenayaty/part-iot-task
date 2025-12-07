// agent/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
		transport: Transport.NATS,
		options: {
			servers: [process.env.NATS_URL || "nats://localhost:4222"],
			// Queue group ensures only one instance handles the request if you scale up
			queue: "agent_health_queue",
		},
	});

	await app.listen();
	console.log("Agent Service is listening on NATS...");
}
bootstrap();
