import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EVENTS, EventSubscriber, OnEvent, Payload } from "@part-iot/common";
import { Model } from "mongoose";

import { SensorEventDTO } from "./dto/sensor-event.dto";
import { RawEvent, RawEventDocument } from "./models/raw-event.model";
import { RuleService } from "../rule/rule.service";

@EventSubscriber()
export class ProcessEvents {
	private logger = new Logger(ProcessEvents.name);
	constructor(
		@InjectModel(RawEvent.name) private RawEventModel: Model<RawEventDocument>,
		private readonly ruleService: RuleService,
	) {}
	@OnEvent(EVENTS.AGENT.SENSOR_EVENT)
	async handleMediaProgressUpdate(
		@Payload(SensorEventDTO) payload: SensorEventDTO,
	): Promise<void> {
		await this.RawEventModel.create({
			agendId: payload.agentId,
			sensorType: payload.event,
			value: payload.value,
			unixTime: payload.unixTime,
		}).catch((err) => console.error(err));

		const matchedRules = await this.ruleService.mathRulesWithRedis(
			payload.event,
			payload.value,
		);

		// If no rules matched, stop here.
		if (!matchedRules.length) {
			this.logger.log(
				`No rules matched for event ${payload.event} with value ${payload.value}`,
			);
		}
		this.logger.log(
			`Found ${matchedRules.length} matched rules for event ${payload.event} with value ${payload.value}`,
		);

		// // 3. Process matches (Write to Match collection and Update Redis Stats)
		// // We use Promise.all for parallelism since we might have multiple matches
		// await Promise.all(matchedRules.map((rule) => this.handleMatch(event, rule)));
	}
}
