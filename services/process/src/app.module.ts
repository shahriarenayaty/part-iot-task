import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthModule } from "./health/health.module";
import { NatsClientModule } from "./nats-client.module";
import { ProcessModule } from "./process/process.module";
import { validateSchema } from "./utils/config.schema";

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: validateSchema,
			isGlobal: true,
		}),
		HealthModule,
		NatsClientModule,
		ProcessModule,
	],
})
export class AppModule {}
