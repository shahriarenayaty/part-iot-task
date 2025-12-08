import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Operator, OperatorArray, SensorEvent, SensorEventArray } from "@part-iot/common";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type MatchEventDocument = HydratedDocument<MatchEvent> & {
	createdAt: Date;
};

@Schema({ _id: false })
export class EventSnapshot {
	@Prop({ type: String, enum: SensorEventArray, required: true })
	sensorType: SensorEvent;

	@Prop()
	value: number;
}
@Schema({ _id: false })
export class RuleSnapshot {
	@Prop({ type: String, enum: SensorEventArray, required: true })
	metric: SensorEvent;

	@Prop({ type: String, enum: OperatorArray, required: true })
	operator: Operator;

	@Prop()
	threshold: number;
}

@Schema()
export class MatchEvent {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: "Rule", required: true })
	ruleId: MongooseSchema.Types.ObjectId;

	@Prop()
	agentId: String;

	@Prop({ type: EventSnapshot })
	eventSnapshot: EventSnapshot;

	@Prop({ type: RuleSnapshot })
	ruleSnapshot: RuleSnapshot;

	@Prop()
	unixTime: number;
}

export const MatchEventSchema = SchemaFactory.createForClass(MatchEvent);

MatchEventSchema.index({ ruleId: 1, unixTime: 1, agentId: 1 });
