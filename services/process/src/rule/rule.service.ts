import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateRuleDTO } from "./dtos";
import { Rule, RuleDocument } from "./rule.model";

@Injectable()
export class RuleService {
	constructor(@InjectModel(Rule.name) private RuleModel: Model<RuleDocument>) {}

	async create(data: CreateRuleDTO): Promise<RuleDocument> {
		const createdRule = new this.RuleModel(data);
		return createdRule.save();
	}
	async list(page: number, pageSize: number): Promise<RuleDocument[]> {
		return this.RuleModel.find()
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.exec();
	}
	async update(ruleId: string, data: Partial<Rule>): Promise<RuleDocument | null> {
		return this.RuleModel.findByIdAndUpdate(ruleId, data, { new: true }).exec();
	}
	async delete(ruleId: string): Promise<RuleDocument | null> {
		return this.RuleModel.findByIdAndDelete(ruleId).exec();
	}
}
