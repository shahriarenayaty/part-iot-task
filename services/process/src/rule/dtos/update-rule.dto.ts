import { Operator, OPERATOR, RuleDTO } from "@part-iot/common";
import { IsEnum, IsMongoId, IsNumber } from "class-validator";

export class UpdateRuleDTO implements RuleDTO.UpdateRuoe {
	@IsMongoId()
	ruleId: string;

	@IsEnum(OPERATOR)
	operator: Operator;

	@IsNumber()
	threshold: number;
}
