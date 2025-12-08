import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Operator, OperatorArray, SensorEvent, SensorEventArray } from "@part-iot/common";
import { HydratedDocument } from "mongoose";

export type RuleDocument = HydratedDocument<Rule> & {
	createdAt: Date;
};

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Rule {
	@Prop({ type: String, enum: SensorEventArray, required: true })
	metric: SensorEvent;

	@Prop({ type: String, enum: OperatorArray, required: true })
	operator: Operator;

	@Prop()
	threshold: number;
}

export const RuleSchema = SchemaFactory.createForClass(Rule);

RuleSchema.index({ metric: 1 });
