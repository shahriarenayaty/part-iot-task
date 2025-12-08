export const ACTIONS = {
	AGENT: {
		HEALTH: "agent.health",
	},
	PROCESS: {
		HEALTH: "process.health",
	},
	RULE: {
		CREATE: "rule.create",
		DELETE: "rule.delete",
		UPDATE: "rule.update",
		LIST: "rule.list",
	},
	REPORT: {
		RULE_HISTORY: "report.rule.history",
		RULE_RANKING: "report.rule.ranking",
	},
} as const;
