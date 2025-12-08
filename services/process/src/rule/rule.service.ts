import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import Redis from "ioredis";
import { Model } from "mongoose";

import { CreateRuleDTO } from "./dtos";
import { Rule, RuleDocument } from "./rule.model";
import { REDIS_CLIENT } from "../database/redis/redis.module";

@Injectable()
export class RuleService implements OnModuleInit {
	private readonly logger = new Logger(RuleService.name);
	constructor(
		@InjectModel(Rule.name) private RuleModel: Model<RuleDocument>,
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
	) {}

	async onModuleInit(): Promise<void> {
		await this.syncRulesToRedis();
	}

	async create(data: CreateRuleDTO): Promise<RuleDocument> {
		const createdRule = new this.RuleModel(data);
		const rule = await createdRule.save();
		const redisKey = `rules:active:${data.metric}`;

		await this.redis.hset(redisKey, rule._id.toString(), JSON.stringify(rule.toObject()));
		return rule;
	}
	async list(page: number, pageSize: number): Promise<RuleDocument[]> {
		return this.RuleModel.find()
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.exec();
	}
	async update(ruleId: string, data: Partial<Rule>): Promise<RuleDocument | null> {
		const oldRule = await this.RuleModel.findById(ruleId);

		if (!oldRule) {
			throw new NotFoundException("Rule not found");
		}

		const updatedRule = await this.RuleModel.findByIdAndUpdate(ruleId, data, {
			new: true,
		}).exec();

		// 3. Sync with Redis
		await this.syncRuleToRedis(oldRule, updatedRule);

		return updatedRule;
	}
	async delete(ruleId: string): Promise<RuleDocument | null> {
		const rule = await this.RuleModel.findById(ruleId);
		if (!rule) return;
		await this.redis.hdel(`rules:active:${rule.metric}`, ruleId);
		await this.RuleModel.deleteOne({ _id: ruleId });
	}

	/**
	 * @deprecated Use mathRulesWithRedis instead
	 * becase of performance issues with large datasets and redis is much faster.
	 */
	async mathchRulesWithAggregation(
		eventName: string,
		eventValue: number,
	): Promise<RuleDocument[]> {
		const matchedRules = await this.RuleModel.aggregate<RuleDocument>([
			{
				$match: { metric: eventName },
			},
			{
				$match: {
					$expr: {
						$switch: {
							branches: [
								// Case: Operator is '>' -> Check if value > $threshold
								{
									case: { $eq: ["$operator", ">"] },
									then: { $gt: [eventValue, "$threshold"] },
								},
								// Case: Operator is '<' -> Check if value < $threshold
								{
									case: { $eq: ["$operator", "<"] },
									then: { $lt: [eventValue, "$threshold"] },
								},
								// Case: Operator is '=' -> Check if value == $threshold
								{
									case: { $eq: ["$operator", "="] },
									then: { $eq: [eventValue, "$threshold"] },
								},
							],
							// If operator matches none, return false (no match)
							default: false,
						},
					},
				},
			},
		]);
		return matchedRules;
	}

	async mathRulesWithRedis(eventName: string, eventValue: number): Promise<RuleDocument[]> {
		const redisKey = `rules:active:${eventName}`;
		const rulesRaw = await this.redis.hvals(redisKey);
		if (!rulesRaw.length) return [];
		const matches = [];

		for (const ruleStr of rulesRaw) {
			const rule = JSON.parse(ruleStr) as Rule;
			//check if rule is valid object
			if (!rule?.operator || rule.threshold === undefined) {
				continue;
			}

			if (this.checkCondition(eventValue, rule)) {
				matches.push(rule);
			}
		}
		return matches;
	}

	private async syncRulesToRedis() {
		this.logger.log("🔄 Starting Rule Cache Warming...");
		const start = Date.now();

		try {
			// 1. Fetch all rules from MongoDB (The Source of Truth)
			const allRules = await this.RuleModel.find().lean().exec();

			if (allRules.length === 0) {
				this.logger.log("⚠️ No rules found in MongoDB.");
				return;
			}

			const existingKeys = await this.redis.keys("rules:active:*");
			if (existingKeys.length > 0) {
				await this.redis.del(...existingKeys);
			}

			const pipeline = this.redis.pipeline();

			for (const rule of allRules) {
				const redisKey = `rules:active:${rule.metric}`;

				pipeline.hset(redisKey, rule._id.toString(), JSON.stringify(rule));
			}

			// 4. Execute Pipeline
			await pipeline.exec();

			const duration = Date.now() - start;
			this.logger.log(
				`✅ Cache Warming Complete. Loaded ${allRules.length} rules in ${duration}ms.`,
			);
		} catch (error) {
			this.logger.error("❌ Failed to sync rules to Redis", error);
		}
	}

	private checkCondition(value: number, rule: Rule): boolean {
		// Cast to number to be safe
		const val = Number(value);
		const thr = Number(rule.threshold);

		switch (rule.operator) {
			case ">":
				return val > thr;
			case "<":
				return val < thr;
			case "=":
				return val === thr;
			default:
				return false;
		}
	}
	private async syncRuleToRedis(oldRule: RuleDocument, updatedRule: RuleDocument) {
		const oldKey = `rules:active:${oldRule.metric}`;
		const newKey = `rules:active:${updatedRule.metric}`;
		const ruleId = updatedRule._id.toString();

		if (oldRule.metric !== updatedRule.metric) {
			const pipeline = this.redis.pipeline();

			// Remove from old hash
			pipeline.hdel(oldKey, ruleId);

			// Add to new hash
			pipeline.hset(newKey, ruleId, JSON.stringify(updatedRule.toObject()));

			await pipeline.exec();
		} else {
			await this.redis.hset(newKey, ruleId, JSON.stringify(updatedRule.toObject()));
		}
	}
}
