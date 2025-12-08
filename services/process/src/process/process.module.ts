import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { RawEvent, RawEventSchema } from "./models/raw-event.model";
import { ProcessController } from "./process.controller";
import { ProcessEvents } from "./process.events";
import { ProcessService } from "./process.service";
import { RuleModule } from "../rule/rule.module";

@Module({
	controllers: [ProcessController],
	providers: [ProcessService, ProcessEvents],
	imports: [
		RuleModule,
		MongooseModule.forFeature([
			{
				name: RawEvent.name,
				schema: RawEventSchema,
			},
		]),
	],
})
export class ProcessModule {}
