import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EVENTS, EventSubscriber, OnEvent, Payload } from "@part-iot/common";
import { Model } from "mongoose";

import { SensorEventDTO } from "./dto/sensor-event.dto";
import { RawEvent, RawEventDocument } from "./models/raw-event.model";
import { ProcessService } from "./process.service";
import { RuleService } from "../rule/rule.service";
import { MatchEvent, MatchEventDocument } from "./models/match-event.model";
import { RuleDocument } from "../rule/rule.model";

@EventSubscriber()
export class ProcessEvents {
	private logger = new Logger(ProcessEvents.name);
	constructor(
		@InjectModel(RawEvent.name) private RawEventModel: Model<RawEventDocument>,
		@InjectModel(MatchEvent.name) private MatchEventModel: Model<MatchEventDocument>,
		private readonly processService: ProcessService,
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
			return;
		}
		this.logger.log(
			`Found ${matchedRules.length} matched rules for event ${payload.event} with value ${payload.value}`,
		);

		await Promise.all(matchedRules.map(async (rule) => this.handleMatch(payload, rule)));
	}

	private async handleMatch(payload: SensorEventDTO, rule: RuleDocument) {
		// 1. Store the Match (Historical Record with Snapshots)
		await this.MatchEventModel.create({
			ruleId: rule._id,
			agentId: payload.agentId,
			eventSnapshot: {
				sensorType: payload.event,
				value: payload.value,
			},
			ruleSnapshot: {
				metric: rule.metric,
				operator: rule.operator,
				threshold: rule.threshold,
			},
			createdAt: new Date(),
		});

		this.processService.incrementRuleUsage(rule._id.toString(), payload.agentId);
	}
}
