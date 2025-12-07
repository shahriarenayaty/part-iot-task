import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateSchema } from "./utils/config.schema";
import { NatsClientModule } from "./nats-client.module";
import { HealthModule } from "./health/health.module";

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
