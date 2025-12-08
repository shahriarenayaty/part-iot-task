import { BadRequestException, Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ACTIONS } from "@part-iot/common";
import { RuleHistoryReportDTO } from "@part-iot/common/dist/dto/report";
import { firstValueFrom } from "rxjs";

import { NATS_BROKER } from "../utils/consts";
import {
	RuleHistoryParamsDTO,
	RuleHistoryQueryDTO,
	RuleHistoryReportResponseDTO,
} from "./dtos/history.dto";

@Controller("reports")
export class ReportController {
	constructor(@Inject(NATS_BROKER) private readonly natsClient: ClientProxy) {}

	@Get("rules/:ruleId/history")
	async getRules(
		@Param() params: RuleHistoryParamsDTO,
		@Query() query: RuleHistoryQueryDTO,
	): Promise<RuleHistoryReportResponseDTO[]> {
		if (query.to <= query.from) {
			throw new BadRequestException("Invalid time range: 'to' must be greater than 'from'");
		}
		const maximumRange = 24 * 60 * 60 * 1000; // one day in unix time milliseconds
		if (query.to.getTime() - query.from.getTime() > maximumRange) {
			throw new BadRequestException("Time range too large: maximum allowed range is 1 day");
		}
		const payload: RuleHistoryReportDTO = {
			ruleId: params.ruleId,
			from: query.from,
			to: query.to,
		};
		return firstValueFrom(
			this.natsClient.send<RuleHistoryReportResponseDTO[]>(
				ACTIONS.REPORT.RULE_HISTORY,
				payload,
			),
		);
	}

	@Get("rules/:ruleId/ranking")
	async getRuleRanking(@Param() params: RuleHistoryParamsDTO): Promise<string[]> {
		const payload = {
			ruleId: params.ruleId,
		};
		return firstValueFrom(this.natsClient.send<string[]>(ACTIONS.REPORT.RULE_RANKING, payload));
	}
}
