import { IsUnixTimestamp, ReportDTO } from "@part-iot/common";
import { IsMongoId } from "class-validator";

export class RuleHistoryParamsDTO {
	@IsMongoId()
	ruleId: string;
}
export class RuleHistoryQueryDTO {
	@IsUnixTimestamp()
	from: number;

	@IsUnixTimestamp()
	to: number;
}

export class RuleHistoryReportDTO implements ReportDTO.RuleHistoryReportResponseDTO {
	agentId: string;
	times: number[];
}
