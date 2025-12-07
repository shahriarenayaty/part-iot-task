import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { EnvConfig } from "./utils/config.schema";
import { NATS_BROKER } from "./utils/consts";

@Global()
@Module({
	imports: [
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
	exports: [ClientsModule],
})
export class NatsClientModule {}
