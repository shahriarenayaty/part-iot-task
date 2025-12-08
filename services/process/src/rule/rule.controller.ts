import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, NatsContext, Payload } from "@nestjs/microservices";
import { ACTIONS, RuleDTO } from "@part-iot/common";

import { CreateRuleDTO } from "./dtos";
import { RuleMapper } from "./mappers/rule.mapper";
import { RuleService } from "./rule.service";

@Controller()
export class RuleController {
	constructor(private readonly ruleService: RuleService) {}
	@MessagePattern(ACTIONS.RULE.CREATE)
	async create(
		@Payload() data: CreateRuleDTO,
		@Ctx() _context: NatsContext,
	): Promise<RuleDTO.RuleResDTO> {
		const rule = await this.ruleService.create(data);
		return RuleMapper.mapToRuleResDTO(rule);
	}
}
