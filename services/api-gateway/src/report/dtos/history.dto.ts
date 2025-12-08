import { ApiProperty } from "@nestjs/swagger";
import { ReportDTO } from "@part-iot/common";
import { IsDate, IsMongoId } from "class-validator";

export class RuleHistoryParamsDTO {
	@IsMongoId()
	ruleId: string;
}
export class RuleHistoryQueryDTO {
	@ApiProperty({ example: "2025-12-08T00:00:00.000+00:00" })
	@IsDate()
	from: Date;

	@ApiProperty({ example: "2025-12-08T23:59:59.999+00:00" })
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
