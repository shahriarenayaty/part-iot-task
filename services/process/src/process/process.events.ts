import { Logger } from "@nestjs/common";
import { EVENTS, EventSubscriber, OnEvent, Payload } from "@part-iot/common";

import { SensorEventDTO } from "./dto/sensor-event.dto";

@EventSubscriber()
export class ProcessEvents {
	private logger = new Logger(ProcessEvents.name);
	@OnEvent(EVENTS.AGENT.SENSOR_EVENT)
	async handleMediaProgressUpdate(
		@Payload(SensorEventDTO) payload: SensorEventDTO,
	): Promise<void> {
		this.logger.log(`Received sensor event: ${JSON.stringify(payload)}`);
	}
}
