import z from "zod";

const configSchema = z.object({
	NATS_URL: z.string(),
	NAMESPACE: z.string(),
	NODE_ID_PREFIX: z.string(),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	DEBUG: z
		.string()
		.optional()
		.transform((val) => val === "true"),
});

export function validateSchema(config: Record<string, unknown>): EnvConfig {
	// `parse` will throw an error if validation fails
	const validatedConfig = configSchema.parse(config);
	return validatedConfig;
}

type EnvConfig = z.infer<typeof configSchema>;

export type { EnvConfig };
