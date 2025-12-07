import { Global, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { NATS_BROKER } from "./utils/consts";
import { ConfigService } from "@nestjs/config";
import { EnvConfig } from "./utils/config.schema";
import { DiscoveryModule } from "@nestjs/core";
import { EventDispatcherService } from "./event-dispatcher.service";

@Global()
@Module({
	imports: [
		DiscoveryModule,
		ClientsModule.registerAsync([
			{
				name: NATS_BROKER,
				inject: [ConfigService],
				useFactory: async (configService: ConfigService<EnvConfig>) => ({
					transport: Transport.NATS,
					options: {
						servers: [configService.get("NATS_URL")],
					},
				}),
			},
		]),
	],
	providers: [EventDispatcherService],
	exports: [ClientsModule],
})
export class NatsClientModule {}
