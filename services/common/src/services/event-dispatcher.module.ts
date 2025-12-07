import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DiscoveryModule } from "@nestjs/core";

import { EventDispatcherService } from "./event-dispatcher.service";

@Module({
	imports: [ConfigModule, DiscoveryModule],
	providers: [EventDispatcherService],
	exports: [EventDispatcherService],
})
export class EventDispatcherModule {}
