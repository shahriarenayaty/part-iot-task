import { All, Controller } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
	constructor(private readonly healthService: HealthService) {}
	@All()
	checkHealth() {
		return this.healthService.checkHealth();
	}
}
