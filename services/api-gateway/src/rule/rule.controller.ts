import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

import { CreateRuleDTO } from "./dtos";
import { NATS_BROKER } from "../utils/consts";
import { RuleResDTO } from "./dtos/rule-res.dto";

@Controller("rules")
export class RuleController {
	constructor(@Inject(NATS_BROKER) private readonly natsClient: ClientProxy) {}
	@Post()
	async createRule(@Body() body: CreateRuleDTO): Promise<RuleResDTO> {
		return firstValueFrom(this.natsClient.send<RuleResDTO>("rule.create", body));
	}
}
