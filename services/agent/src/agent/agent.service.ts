import { faker } from "@faker-js/faker";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";
import {
	AgentDTO,
	DEFAULT_SENSOR_LIMITS,
	EVENTS,
	SENSOR_EVENT,
	SENSOR_THRESHOLDS,
	SensorEventArray,
} from "@part-iot/common";

import { EnvConfig } from "../utils/config.schema";
import { NATS_BROKER } from "../utils/consts";

@Injectable()
export class AgentService implements OnModuleInit {
	private logger = new Logger(AgentService.name);
	private readonly agentId: string;

	constructor(
		@Inject(NATS_BROKER) private readonly natsClient: ClientProxy,
		configService: ConfigService<EnvConfig>,
	) {
		this.agentId = configService.get<string>("AGENT_ID");
	}

	onModuleInit(): void {
		this.startEmitting();
	}

	private startEmitting() {
		// 5 times per second (200ms)
		setInterval(() => {
			const metricType = faker.helpers.arrayElement(SensorEventArray);
			const limit = SENSOR_THRESHOLDS[metricType] || DEFAULT_SENSOR_LIMITS;

			let value: number;
			switch (metricType) {
				case SENSOR_EVENT.TEMPERATURE:
					value = faker.number.int({
						min: limit.min,
						max: limit.max,
					});
					break;
				case SENSOR_EVENT.VOLTAGE:
					value = faker.number.int({ min: limit.min, max: limit.max });
					break;
				default:
					value = faker.number.int({ min: limit.min, max: limit.max });
			}

			const payload: AgentDTO.SensorEventDTO = {
				agentId: this.agentId,
				event: metricType,
				value: value,
				unixTime: Date.now(),
			};

			this.natsClient.emit(EVENTS.AGENT.SENSOR_EVENT, payload);
			this.logger.debug(`Emitted sensor event: ${JSON.stringify(payload)}`);
		}, 200);
	}
}
