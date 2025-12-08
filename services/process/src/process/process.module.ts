import { Module } from "@nestjs/common";

import { ProcessController } from "./process.controller";
import { ProcessEvents } from "./process.events";
import { ProcessService } from "./process.service";

@Module({
	controllers: [ProcessController],
	providers: [ProcessService, ProcessEvents],
})
export class ProcessModule {}
