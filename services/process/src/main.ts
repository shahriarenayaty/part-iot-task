// agent/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";

async function bootstrap() {
	const logger = new Logger("ProcessService");
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
		transport: Transport.NATS,
		options: {
			servers: [process.env.NATS_URL || "nats://localhost:4222"],
		},
	});

	await app.listen();

	logger.log("Agent Service is listening on NATS...");
}
bootstrap();
