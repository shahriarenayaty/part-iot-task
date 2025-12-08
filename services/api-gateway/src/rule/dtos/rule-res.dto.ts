import { ApiProperty } from "@nestjs/swagger";
import { OPERATOR, Operator, RuleDTO, SENSOR_EVENT, SensorEvent } from "@part-iot/common";

export class RuleResDTO implements RuleDTO.RuleResDTO {
	ruleId: string;
	@ApiProperty({ enum: SENSOR_EVENT })
	metric: SensorEvent;
	@ApiProperty({ enum: OPERATOR })
	operator: Operator;
	threshold: number;
	createdAt: string;
}
