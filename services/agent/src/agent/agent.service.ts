import { faker } from "@faker-js/faker";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";
import {
	AgentDTO,
	EVENTS,
	SENSOR_MAX_VALUE,
	SENSOR_MIN_VALUE,
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

			const payload: AgentDTO.SensorEventDTO = {
				agentId: this.agentId,
				event: metricType,
				value: faker.number.int({ min: SENSOR_MIN_VALUE, max: SENSOR_MAX_VALUE }),
				unixTime: Date.now(),
			};

			this.natsClient.emit(EVENTS.AGENT.SENSOR_EVENT, payload);
			this.logger.debug(`Emitted sensor event: ${JSON.stringify(payload)}`);
		}, 200);
	}
}
