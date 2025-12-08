import { RuleDTO } from "@part-iot/common";
import { IsNumber } from "class-validator";

export class RuleListDTO implements RuleDTO.ListRule {
	@IsNumber()
	page: number;

	@IsNumber()
	pageSize: number;
}
