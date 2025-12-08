import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { RuleController } from "./rule.controller";
import { Rule, RuleSchema } from "./rule.model";
import { RuleService } from "./rule.service";

@Module({
	controllers: [RuleController],
	providers: [RuleService],
	imports: [
		MongooseModule.forFeature([
			{
				name: Rule.name,
				schema: RuleSchema,
			},
		]),
	],
	exports: [RuleService],
})
export class RuleModule {}
