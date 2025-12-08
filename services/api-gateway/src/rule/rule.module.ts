import { Module } from "@nestjs/common";

import { RuleController } from "./rule.controller";

@Module({
	controllers: [RuleController],
})
export class RuleModule {}
