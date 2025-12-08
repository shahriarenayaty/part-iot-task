import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import Redis from "ioredis/built/Redis";
import { Model } from "mongoose";

import { MatchEvent } from "./models/match-event.model";
import { REDIS_CLIENT } from "../database/redis/redis.module";

@Injectable()
export class ProcessService implements OnModuleInit {
	private readonly logger = new Logger(ProcessService.name);
	constructor(
		@InjectModel(MatchEvent.name) private MatchModel: Model<MatchEvent>,
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
	) {}

	async onModuleInit(): Promise<void> {
		await this.syncStatsToRedis();
	}

	async incrementRuleUsage(ruleId: string, agentId: string): Promise<void> {
		const redisKey = `stats:rule:${ruleId}`;
		await this.redis.zincrby(redisKey, 1, agentId);
	}

	private async syncStatsToRedis() {
		this.logger.log("📊 Starting Statistics Cache Warming (Rebuilding Rankings)...");
		const start = Date.now();

		try {
			// 1. Aggregation: Ask MongoDB to count matches grouped by Rule + Agent
			// This reduces millions of documents into a much smaller list of "totals"
			const stats = await this.MatchModel.aggregate([
				{
					$group: {
						_id: {
							ruleId: "$ruleId",
							agentId: "$agentId",
						},
						totalMatches: { $sum: 1 },
					},
				},
			]).exec();

			if (stats.length === 0) {
				this.logger.log("⚠️ No historical matches found to sync.");
				return;
			}

			// 2. Prepare Redis Pipeline
			const pipeline = this.redis.pipeline();

			// 3. Loop through the grouped results
			for (const record of stats) {
				const ruleId = record._id.ruleId.toString();
				const agentId = record._id.agentId;
				const count = record.totalMatches;

				const redisKey = `stats:rule:${ruleId}`;

				// IMPORTANT: Use ZADD (Set Score), not ZINCRBY (Add Score).
				// This ensures that if you run this script twice, the numbers remain correct
				// (matching MongoDB) rather than doubling up.
				pipeline.zadd(redisKey, count, agentId);
			}

			// 4. Execute all writes in one network round-trip
			await pipeline.exec();

			const duration = Date.now() - start;
			this.logger.log(
				`✅ Stats Warming Complete. Synced rankings for ${stats.length} Agent/Rule pairs in ${duration}ms.`,
			);
		} catch (error) {
			this.logger.error("❌ Failed to sync stats to Redis", error);
		}
	}
}
