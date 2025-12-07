import { All, Controller } from "@nestjs/common";

import { HealthResDTO } from "./dto/res.dto";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
	constructor(private readonly healthService: HealthService) {}
	@All()
	async checkHealth(): Promise<HealthResDTO> {
		return this.healthService.checkHealth();
	}
}
