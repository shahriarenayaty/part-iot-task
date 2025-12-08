import { Operator, SensorEvent } from "../../types";

export interface RuleDTO {
	metric: SensorEvent;
	operator: Operator;
	threshold: number;
}
export interface RuleResDTO extends RuleDTO {
	ruleId: string;
	createdAt: string;
}
