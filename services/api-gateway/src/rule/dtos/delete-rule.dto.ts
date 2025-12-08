import { RuleDTO } from "@part-iot/common";
import { IsMongoId } from "class-validator";

export class DeleteRuleDTO implements RuleDTO.DeleteRule {
	@IsMongoId()
	ruleId: string;
}
