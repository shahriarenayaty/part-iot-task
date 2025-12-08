import { ApiProperty } from "@nestjs/swagger";
import { Operator, OPERATOR, RuleDTO, SENSOR_EVENT, SensorEvent } from "@part-iot/common";
import { IsEnum, IsNumber } from "class-validator";

export class CreateRuleDTO implements RuleDTO.CreateRuleDTO {
	@IsEnum(SENSOR_EVENT)
	@ApiProperty({ enum: SENSOR_EVENT })
	metric: SensorEvent;

	@IsEnum(OPERATOR)
	@ApiProperty({ enum: OPERATOR })
	operator: Operator;

	@IsNumber()
	threshold: number;
}
