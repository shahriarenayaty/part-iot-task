export interface RuleHistoryReportDTO {
	ruleId: string;
	from: Date;
	to: Date;
}

export interface RuleHistoryReportResponseDTO {
	agentId: string;
	times: number[];
}
