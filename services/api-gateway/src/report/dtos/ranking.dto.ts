import { ReportDTO } from "@part-iot/common";
import { IsMongoId } from "class-validator";

export class RuleRankingParamsDTO {
	@IsMongoId()
	ruleId: string;
}

export class RuleRankingReportResponseDTO implements ReportDTO.RuleRankingReportResponseDTO {
	agentId: string;
	timesTriggered: number;
}
