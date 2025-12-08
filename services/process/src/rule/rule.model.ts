import { Prop, Schema } from "@nestjs/mongoose";
import { Operator, OperatorArray, SensorEvent, SensorEventArray } from "@part-iot/common";
import { HydratedDocument } from "mongoose";

export type RuleDocument = HydratedDocument<RuleSchema> & {
	createdAt: Date;
};

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RuleSchema {
	@Prop({ type: String, enum: SensorEventArray, required: true })
	metric: SensorEvent;

	@Prop({ type: String, enum: OperatorArray, required: true })
	operator: Operator;

	@Prop()
	threshold: Number;
}
