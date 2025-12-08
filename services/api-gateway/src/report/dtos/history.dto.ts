import { ReportDTO } from "@part-iot/common";
import { IsDate, IsMongoId } from "class-validator";

export class RuleHistoryParamsDTO {
	@IsMongoId()
	ruleId: string;
}
export class RuleHistoryQueryDTO {
	@IsDate()
	from: Date;

	@IsDate()
	to: Date;
}
export class RuleHistoryReportDTO implements ReportDTO.RuleHistoryReportDTO {
	ruleId: string;
	from: Date;
	to: Date;
}

export class RuleHistoryReportResponseDTO implements ReportDTO.RuleHistoryReportResponseDTO {
	agentId: string;
	times: number[];
}
