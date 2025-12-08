import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ReportDTO } from "@part-iot/common";
import Redis from "ioredis/built/Redis";
import { Model, Types } from "mongoose";

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

	async generateRuleHistoryReport(
		ruleId: string,
		from: Date,
		to: Date,
	): Promise<ReportDTO.RuleHistoryReportResponseDTO[]> {
		const objectId = new Types.ObjectId(ruleId);

		const cursor = this.MatchModel.find({
			"metadata.ruleId": objectId,
			timestamp: { $gte: from, $lte: to },
		})
			.select({ "metadata.agentId": 1, timestamp: 1, _id: 0 })
			.sort({ "metadata.agentId": 1, timestamp: 1 })
			.lean()
			.cursor();

		const results: ReportDTO.RuleHistoryReportResponseDTO[] = [];

		let currentAgent: string | null = null;
		let currentTimes: number[] = [];

		for await (const doc of cursor) {
			const docAgentId = doc.metadata.agentId;
			const time = doc.timestamp.getTime();

			if (currentAgent !== docAgentId) {
				// New agent found, push previous agent's data to results
				if (currentAgent) {
					results.push({ agentId: currentAgent, times: currentTimes });
				}
				// Reset for new agent
				currentAgent = docAgentId;
				currentTimes = [time];
			} else {
				currentTimes.push(time);
			}
		}

		// Push the last agent
		if (currentAgent) {
			results.push({ agentId: currentAgent, times: currentTimes });
		}

		return results;
	}

	async generateRuleRankingReport(
		params: ReportDTO.RuleRankingReportDTO,
	): Promise<ReportDTO.RuleRankingReportResponseDTO[]> {
		const { page, pageSize } = params;
		const start = (page - 1) * pageSize;
		const end = start + pageSize - 1;

		const redisKey = `stats:rule:${params.ruleId}`;
		const rawRanking = await this.redis.zrevrange(redisKey, start, end, "WITHSCORES");
		const results: ReportDTO.RuleRankingReportResponseDTO[] = [];

		for (let i = 0; i < rawRanking.length; i += 2) {
			const agentId = rawRanking[i];
			const timesTriggered = parseInt(rawRanking[i + 1], 10);
			results.push({ agentId, timesTriggered });
		}

		return results;
	}

	async incrementRuleUsage(ruleId: string, agentId: string): Promise<void> {
		const redisKey = `stats:rule:${ruleId}`;
		await this.redis.zincrby(redisKey, 1, agentId);
	}

	private async syncStatsToRedis() {
		this.logger.log("📊 Starting Statistics Cache Warming (Rebuilding Rankings)...");
		const start = Date.now();

		try {
			const stats = await this.MatchModel.aggregate([
				{
					$group: {
						_id: {
							ruleId: "$metadata.ruleId",
							agentId: "$metadata.agentId",
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
