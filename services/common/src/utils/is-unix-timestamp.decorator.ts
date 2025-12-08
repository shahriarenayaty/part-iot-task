import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsUnixTimestamp(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string): void {
		registerDecorator({
			name: "isUnixTimestamp",
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: unknown, _args: ValidationArguments) {
					// 1. Must be a number
					if (typeof value !== "number") return false;

					// 2. Must be an integer
					if (!Number.isInteger(value)) return false;

					// 3. Check for reasonable length (Milliseconds usually 13 digits)
					// Adjust valid range as needed.
					// 1000000000000 represents ~2001, 9999999999999 represents ~2286
					return value > 1000000000000 && value < 9999999999999;
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be a valid Unix timestamp in milliseconds`;
				},
			},
		});
	};
}
