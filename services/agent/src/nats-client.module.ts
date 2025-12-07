import { Global, Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { NATS_BROKER } from "./utils/consts";
import { ConfigService } from "@nestjs/config";
import { EnvConfig } from "./utils/config.schema";
import { EventDispatcherModule } from "@part-iot/common";

@Global()
@Module({
	imports: [
		EventDispatcherModule,
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
