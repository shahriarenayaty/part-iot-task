import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { DatabaseService } from "./database.service";
import { EnvConfig } from "../../utils/config.schema";

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: (configService: ConfigService<EnvConfig>) => ({
				uri: configService.get<string>("MONGODB_URL"),
			}),
			inject: [ConfigService],
		}),
	],
	providers: [DatabaseService],
	exports: [DatabaseService],
})
export class DatabaseModule {}
