import { baseConfigSchema } from "@part-iot/common";
import z from "zod";

const configSchema = baseConfigSchema.extend({
	NODE_ID_PREFIX: z.string(),
	AGENT_ID: z.string(),
});

export function validateSchema(config: Record<string, unknown>): EnvConfig {
	// `parse` will throw an error if validation fails
	const validatedConfig = configSchema.parse(config);
	return validatedConfig;
}

type EnvConfig = z.infer<typeof configSchema>;

export type { EnvConfig };
