import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { NatsClientModule } from "./nats-client.module";
import { ProcessModule } from "./process/process.module";
import { RuleModule } from "./rule/rule.module";
import { validateSchema } from "./utils/config.schema";

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: validateSchema,
			isGlobal: true,
		}),
		DatabaseModule,
		HealthModule,
		NatsClientModule,
		ProcessModule,
		RuleModule,
	],
})
export class AppModule {}
