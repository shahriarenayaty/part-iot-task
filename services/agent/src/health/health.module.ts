import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { HealthEvent } from "./health.event";

@Module({
	controllers: [HealthController],
	providers: [HealthService, HealthEvent],
})
export class HealthModule {}
