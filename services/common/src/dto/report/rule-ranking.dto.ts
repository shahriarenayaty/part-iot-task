export interface RuleRankingReportDTO {
	ruleId: string;
	page: number;
	pageSize: number;
}

export interface RuleRankingReportResponseDTO {
	agentId: string;
	timesTriggered: number;
}
