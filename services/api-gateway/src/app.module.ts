import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateSchema } from "./utils/config.schema";
import { HealthController } from "./health/health.controller";
import { HealthModule } from "./health/health.module";
import { NatsClientModule } from "./nats-client.module";

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
