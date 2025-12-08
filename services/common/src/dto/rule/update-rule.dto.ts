import { Operator } from "../../types";

export interface UpdateRuoe {
	ruleId: string;
	operator: Operator;
	threshold: number;
}
