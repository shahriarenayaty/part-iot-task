import { ApiProperty } from "@nestjs/swagger";
import { HealthDTO } from "@part-iot/common";

export class ServiceHealthDTO {
	@ApiProperty({ example: "ok" })
	status: "ok" | "down";

	@ApiProperty({ example: "agent", required: false })
	service?: string;

	@ApiProperty({ example: "2025-12-07T22:23:24.777Z", required: false })
	timestamp?: string;

	@ApiProperty({ example: "Connection refused", required: false })
	error?: string;
}

export class HealthResDTO {
	@ApiProperty({ example: "ok" })
	api_gateway: string;

	@ApiProperty({ type: ServiceHealthDTO })
	agent_service: ServiceHealthDTO;

	@ApiProperty({ type: ServiceHealthDTO })
	process_service: ServiceHealthDTO;
}

export type ServiceHealthCheckDTO = HealthDTO.CheckHealthResponseDTO;
