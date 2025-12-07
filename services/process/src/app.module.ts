import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthModule } from "./health/health.module";
import { NatsClientModule } from "./nats-client.module";
import { validateSchema } from "./utils/config.schema";

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: validateSchema,
			isGlobal: true,
		}),
		HealthModule,
		NatsClientModule,
	],
})
export class AppModule {}
