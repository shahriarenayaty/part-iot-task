import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, NatsContext, Payload } from "@nestjs/microservices";
import { ACTIONS, ReportDTO } from "@part-iot/common";

import { ProcessService } from "./process.service";

@Controller("process")
export class ProcessController {
	constructor(private readonly processService: ProcessService) {}

	@MessagePattern(ACTIONS.REPORT.RULE_HISTORY)
	async reportRuleHistory(
		@Payload() data: ReportDTO.RuleHistoryReportDTO,
		@Ctx() _context: NatsContext,
	): Promise<unknown> {
		return this.processService.generateRuleHistoryReport(data.ruleId, data.from, data.to);
	}
}
