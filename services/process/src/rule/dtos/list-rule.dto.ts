import { RuleDTO } from "@part-iot/common";
import { IsNumber } from "class-validator";

export class ListRuleDTO implements RuleDTO.ListRule {
	@IsNumber()
	page: number;

	@IsNumber()
	pageSize: number;
}
