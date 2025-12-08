import { RuleDTO } from "@part-iot/common";

import { RuleDocument } from "../rule.model";

export class RuleMapper {
	static mapToRuleResDTO(rule: RuleDocument): RuleDTO.RuleResDTO {
		return {
			ruleId: rule._id.toString() || "",
			metric: rule.metric,
			operator: rule.operator,
			threshold: rule.threshold,
			createdAt: rule.createdAt.toISOString(),
		};
	}
}
