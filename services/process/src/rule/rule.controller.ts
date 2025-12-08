import { Controller } from "@nestjs/common";
import { Ctx, MessagePattern, NatsContext, Payload } from "@nestjs/microservices";
import { ACTIONS, CommonDTO, RuleDTO } from "@part-iot/common";

import { CreateRuleDTO, DeleteRuleDTO, ListRuleDTO, UpdateRuleDTO } from "./dtos";
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

	@MessagePattern(ACTIONS.RULE.LIST)
	async list(
		@Payload() data: ListRuleDTO,
		@Ctx() _context: NatsContext,
	): Promise<RuleDTO.RuleResDTO[]> {
		const rules = await this.ruleService.list(data.page, data.pageSize);
		return rules.map(RuleMapper.mapToRuleResDTO);
	}

	@MessagePattern(ACTIONS.RULE.DELETE)
	async delete(
		@Payload() data: DeleteRuleDTO,
		@Ctx() _context: NatsContext,
	): Promise<CommonDTO.DeleteDTO> {
		await this.ruleService.delete(data.ruleId);
		return { success: true };
	}

	@MessagePattern(ACTIONS.RULE.UPDATE)
	async update(
		@Payload() data: UpdateRuleDTO,
		@Ctx() _context: NatsContext,
	): Promise<RuleDTO.RuleResDTO> {
		const updatedRule = await this.ruleService.update(data.ruleId, data);
		return RuleMapper.mapToRuleResDTO(updatedRule);
	}
}
