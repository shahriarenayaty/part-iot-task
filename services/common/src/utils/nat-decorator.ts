import { SetMetadata } from "@nestjs/common";

import type { Type } from "@nestjs/common";

export const ON_EVENT_METADATA_KEY = "stream:on_event";
export const PAYLOAD_METADATA_KEY = "stream:payload";
export const PAYLOAD_VALIDATION_METADATA_KEY = "stream:payload_validation";
export const EVENT_SUBSCRIBER_METADATA_KEY = "stream:event_subscriber";

/**
 * Method decorator to mark a method as an event handler.
 * @param eventName The name of the event to listen to.
 */
export const OnEvent = (eventName: string): MethodDecorator =>
	SetMetadata(ON_EVENT_METADATA_KEY, eventName);

/**
 * Parameter decorator to mark a parameter as the event payload.
 * @param dto Optional DTO class for validation
 */
export const Payload =
	(dto?: Type<unknown>): ParameterDecorator =>
	(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
		Reflect.defineMetadata(PAYLOAD_METADATA_KEY, parameterIndex, target, propertyKey as string);
		if (dto) {
			Reflect.defineMetadata(
				PAYLOAD_VALIDATION_METADATA_KEY,
				dto,
				target,
				propertyKey as string,
			);
		}
	};

/**
 * Class decorator to mark a class as a container for event handlers.
 */
export const EventSubscriber = (): ClassDecorator =>
	SetMetadata(EVENT_SUBSCRIBER_METADATA_KEY, true);
