export enum SENSOR_EVENT {
	TEMPERATURE = "temperature",
	PRESSURE = "pressure",
	VOLTAGE = "voltage",
	NOISE = "noise",
}
export type SensorEvent = `${SENSOR_EVENT}`;

export const SensorEventArray: SensorEvent[] = Object.values(SENSOR_EVENT);

export function isSensorEvent(event: string): event is SensorEvent {
	return SensorEventArray.includes(event as SensorEvent);
}
