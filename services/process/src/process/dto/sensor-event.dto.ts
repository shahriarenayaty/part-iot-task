import {
	AgentDTO,
	IsSensorValueWithinRange,
	IsUnixTimestamp,
	SENSOR_EVENT,
	SensorEvent,
} from "@part-iot/common";
import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class SensorEventDTO implements AgentDTO.SensorEventDTO {
	@IsString()
	@IsNotEmpty()
	agentId: string;
	@IsString()
	@IsNotEmpty()
	@IsEnum(SENSOR_EVENT)
	event: SensorEvent;
	@IsNumber()
	@IsUnixTimestamp()
	unixTime: number;
	@IsNumber()
	@IsSensorValueWithinRange()
	value: number;
}
