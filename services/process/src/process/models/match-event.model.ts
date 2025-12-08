import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Operator, OperatorArray, SensorEvent, SensorEventArray } from "@part-iot/common";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type MatchEventDocument = HydratedDocument<MatchEvent>;

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

@Schema({ _id: false })
export class MatchMetadata {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: "Rule", required: true })
	ruleId: MongooseSchema.Types.ObjectId;

	@Prop({ required: true })
	agentId: string;
}
const MatchMetadataSchema = SchemaFactory.createForClass(MatchMetadata);

@Schema({
	timeseries: {
		timeField: "timestamp", // Must match the property name below
		metaField: "metadata", // Must match the property name below
		granularity: "seconds", // 'seconds' is best for high-frequency sensor data
	},
})
export class MatchEvent {
	@Prop({ type: Date, required: true })
	timestamp: Date;

	@Prop({ type: MatchMetadataSchema, required: true })
	metadata: MatchMetadata;

	@Prop({ type: EventSnapshot })
	eventSnapshot: EventSnapshot;

	@Prop({ type: RuleSnapshot })
	ruleSnapshot: RuleSnapshot;
}

export const MatchEventSchema = SchemaFactory.createForClass(MatchEvent);
