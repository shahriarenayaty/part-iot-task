import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SensorEvent, SensorEventArray } from "@part-iot/common";
import { HydratedDocument } from "mongoose";

export type RawEventDocument = HydratedDocument<RawEvent> & {
	createdAt: Date;
};

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RawEvent {
	@Prop()
	agendId: string;

	@Prop({ type: String, enum: SensorEventArray, required: true })
	sensorType: SensorEvent;

	@Prop()
	value: number;

	@Prop()
	unixTime: number;
}

export const RawEventSchema = SchemaFactory.createForClass(RawEvent);
