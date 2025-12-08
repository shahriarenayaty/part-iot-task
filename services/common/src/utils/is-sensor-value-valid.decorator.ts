import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

import { DEFAULT_SENSOR_LIMITS, SENSOR_THRESHOLDS } from "../consts";
import { isSensorEvent } from "../types";

interface ObjectWithEvent {
	event: unknown;
}

export function IsSensorValueWithinRange(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string): void {
		registerDecorator({
			name: "isSensorValueWithinRange",
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: unknown, args: ValidationArguments) {
					const eventType = (args.object as ObjectWithEvent).event;

					if (!eventType || typeof eventType !== "string" || !isSensorEvent(eventType)) {
						return false;
					}

					const limits = SENSOR_THRESHOLDS[eventType] || DEFAULT_SENSOR_LIMITS;

					return typeof value === "number" && value >= limits.min && value <= limits.max;
				},

				defaultMessage(args: ValidationArguments) {
					const eventType = (args.object as ObjectWithEvent).event;

					if (!eventType || typeof eventType !== "string" || !isSensorEvent(eventType)) {
						return `Invalid or missing sensor event type for property '${args.property}'`;
					}

					const limits = SENSOR_THRESHOLDS[eventType] || DEFAULT_SENSOR_LIMITS;

					return `Value for '${eventType}' must be between ${limits.min} and ${limits.max}`;
				},
			},
		});
	};
}
