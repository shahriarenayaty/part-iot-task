import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ACTIONS, CommonDTO } from "@part-iot/common";
import { firstValueFrom } from "rxjs";

import {
	CreateRuleDTO,
	DeleteRuleDTO,
	ListRuleDTO,
	UpdateRuleBodyDTO,
	UpdateRuleDTO,
	UpdateRuleParamsDTO,
} from "./dtos";
import { NATS_BROKER } from "../utils/consts";
import { RuleResDTO } from "./dtos/rule-res.dto";

@Controller("rules")
export class RuleController {
	constructor(@Inject(NATS_BROKER) private readonly natsClient: ClientProxy) {}
	@Post()
	async createRule(@Body() body: CreateRuleDTO): Promise<RuleResDTO> {
		return firstValueFrom(this.natsClient.send<RuleResDTO>(ACTIONS.RULE.CREATE, body));
	}

	@Get()
	async getRules(@Query() query: ListRuleDTO): Promise<RuleResDTO[]> {
		return firstValueFrom(this.natsClient.send<RuleResDTO[]>(ACTIONS.RULE.LIST, query));
	}

	@Delete("/:ruleId")
	async deleteRule(@Param() params: DeleteRuleDTO): Promise<CommonDTO.DeleteDTO> {
		return firstValueFrom(
			this.natsClient.send<CommonDTO.DeleteDTO>(ACTIONS.RULE.DELETE, params),
		);
	}

	@Patch("/:ruleId")
	async updateRole(
		@Param() params: UpdateRuleParamsDTO,
		@Body() body: UpdateRuleBodyDTO,
	): Promise<CommonDTO.DeleteDTO> {
		const updateRuleDto: UpdateRuleDTO = {
			ruleId: params.ruleId,
			operator: body.operator,
			threshold: body.threshold,
		};
		return firstValueFrom(
			this.natsClient.send<CommonDTO.DeleteDTO>(ACTIONS.RULE.UPDATE, updateRuleDto),
		);
	}
}
