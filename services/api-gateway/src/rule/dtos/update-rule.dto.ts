import { ApiProperty } from "@nestjs/swagger";
import { Operator, OPERATOR, RuleDTO } from "@part-iot/common";
import { IsEnum, IsMongoId, IsNumber } from "class-validator";

export class UpdateRuleDTO implements RuleDTO.UpdateRuoe {
	ruleId: string;
	operator: Operator;
	threshold: number;
}

export class UpdateRuleBodyDTO {
	@IsEnum(OPERATOR)
	@ApiProperty({ enum: OPERATOR })
	operator: Operator;

	@IsNumber()
	threshold: number;
}

export class UpdateRuleParamsDTO {
	@IsMongoId()
	ruleId: string;
}
