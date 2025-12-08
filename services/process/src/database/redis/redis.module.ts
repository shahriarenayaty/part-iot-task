import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { EnvConfig } from "../../utils/config.schema";

// We define a unique token for Injection
export const REDIS_CLIENT = "REDIS_CLIENT";

@Global() // Make it global so you don't have to import it in every single module
@Module({
	providers: [
		{
			provide: REDIS_CLIENT,
			inject: [ConfigService],
			useFactory: async (configService: ConfigService<EnvConfig>) => {
				const host = configService.get("REDIS_HOST") ?? "redis";
				const port = parseInt(configService.get("REDIS_PORT") ?? "6379", 10);
				return new Redis({
					host,
					port,
				});
			},
		},
	],
	exports: [REDIS_CLIENT], // Export it so other modules can use it
})
export class RedisModule {}
