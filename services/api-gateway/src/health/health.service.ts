import { Inject, Injectable } from "@nestjs/common";
import { NATS_BROKER } from "../utils/consts";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class HealthService {
	constructor(@Inject(NATS_BROKER) private readonly natsClient: ClientProxy) {}
	checkHealth() {
		return { status: "ok" };
	}
}
