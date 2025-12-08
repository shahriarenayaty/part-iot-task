import { SensorEvent } from "../../types";

export interface SensorEventDTO {
	agentId: string;
	event: SensorEvent;
	value: number;
	unixTime: number;
}
