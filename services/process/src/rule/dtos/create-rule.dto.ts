import { Operator, OPERATOR, RuleDTO, SENSOR_EVENT, SensorEvent } from "@part-iot/common";
import { IsEnum, IsNumber } from "class-validator";

export class CreateRuleDTO implements RuleDTO.CreateRuleDTO {
	@IsEnum(SENSOR_EVENT)
	metric: SensorEvent;

	@IsEnum(OPERATOR)
	operator: Operator;

	@IsNumber()
	threshold: number;
}
