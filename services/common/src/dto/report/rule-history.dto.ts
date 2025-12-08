export interface RuleHistoryReportDTO {
	ruleId: string;
	from: number;
	to: number;
}

export interface RuleHistoryReportResponseDTO {
	agentId: string;
	times: number[];
}
