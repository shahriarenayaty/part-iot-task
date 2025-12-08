import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthModule } from "./health/health.module";
import { NatsClientModule } from "./nats-client.module";
import { ReportModule } from "./report/report.module";
import { RuleModule } from "./rule/rule.module";
import { validateSchema } from "./utils/config.schema";

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: validateSchema,
			isGlobal: true,
		}),
		HealthModule,
		NatsClientModule,
		RuleModule,
		ReportModule,
	],
})
export class AppModule {}
