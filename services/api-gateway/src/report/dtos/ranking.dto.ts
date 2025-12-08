import { ReportDTO } from "@part-iot/common";
import { IsMongoId, IsNumber } from "class-validator";

export class RuleRankingParamsDTO {
	@IsMongoId()
	ruleId: string;
}
export class RuleRankingQueryDTO {
	@IsNumber()
	page: number;
	@IsNumber()
	pageSize: number;
}
export class RuleRankingReportDTO implements ReportDTO.RuleRankingReportDTO {
	ruleId: string;
	page: number;
	pageSize: number;
}

export class RuleRankingReportResponseDTO implements ReportDTO.RuleRankingReportResponseDTO {
	agentId: string;
	timesTriggered: number;
}
