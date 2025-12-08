import { SENSOR_EVENT } from "../types";

interface RangeLimit {
	min: number;
	max: number;
}

// Default Fallback
export const DEFAULT_SENSOR_LIMITS: RangeLimit = { min: 0, max: 150 };

// Configuration Map: Maps specific Enums to their limits
export const SENSOR_THRESHOLDS: Partial<Record<SENSOR_EVENT, RangeLimit>> = {
	[SENSOR_EVENT.TEMPERATURE]: { min: -20, max: 120 },
	[SENSOR_EVENT.VOLTAGE]: { min: 200, max: 240 },
};
