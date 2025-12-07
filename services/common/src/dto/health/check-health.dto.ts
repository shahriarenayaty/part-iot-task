export interface CheckHealthParamsDTO {
	from: string;
}

export type CheckHealthResponseDTO =
	| {
			status: "ok";
			service: string;
			timestamp: string;
	  }
	| {
			status: "down";
			error: string;
	  };
