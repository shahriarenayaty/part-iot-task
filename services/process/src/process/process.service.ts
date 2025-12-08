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
		from: number,
		to: number,
	): Promise<ReportDTO.RuleHistoryReportResponseDTO[]> {
		const objectId = new Types.ObjectId(ruleId);

		// const results = await this.MatchModel.aggregate<ReportDTO.RuleHistoryReportResponseDTO>([
		// 	{
		// 		// Stage 1: Filter by Rule and Time Range
		// 		$match: {
		// 			ruleId: objectId,
		// 			unixTime: { $gte: from, $lte: to },
		// 		},
		// 	},
		// 	{
		// 		$sort: { unixTime: 1 },
		// 	},
		// 	{
		// 		$group: {
		// 			_id: "$agentId",
		// 			times: { $push: "$unixTime" }, // Collect timestamps into an array
		// 		},
		// 	},
		// 	{
		// 		$project: {
		// 			_id: 0,
		// 			agentId: "$_id",
		// 			times: 1,
		// 		},
		// 	},
		// ]).exec();
		// return results;
		// 1. Fetch flat data: Sorted by Agent first, then Time
		// This allows efficient processing in the next step.
		const cursor = this.MatchModel.find({
			ruleId: objectId,
			unixTime: { $gte: from, $lte: to },
		})
			.select({ agentId: 1, unixTime: 1, _id: 0 })
			// If you have the index { ruleId: 1, agentId: 1, unixTime: 1 },
			// sorting by agentId first makes grouping easier in code.
			// However, if you stick to the index { ruleId: 1, unixTime: 1 },
			// just sort by unixTime and group via a map in JS.
			.sort({ unixTime: 1 })
			.lean()
			.cursor(); // Use cursor for memory efficiency

		const resultMap = new Map<string, number[]>();

		// 2. Process stream (efficient memory usage in Node.js)
		for await (const doc of cursor) {
			const agentIdStr = doc.agentId.toString();

			if (!resultMap.has(agentIdStr)) {
				resultMap.set(agentIdStr, []);
			}
			resultMap.get(agentIdStr).push(doc.unixTime);
		}

		// 3. Transform map to array
		const results: ReportDTO.RuleHistoryReportResponseDTO[] = [];
		for (const [agentId, times] of resultMap) {
			results.push({ agentId, times });
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
