import z from "zod";

export const baseConfigSchema = z.object({
	NATS_URL: z.string(),
	NAMESPACE: z.string(),
	SERVICE_NAME: z.string(),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	DEBUG: z
		.string()
		.optional()
		.transform((val) => val === "true"),
});

export type BaseEnvConfig = z.infer<typeof baseConfigSchema>;

export function validateBaseSchema(config: Record<string, unknown>): BaseEnvConfig {
	return baseConfigSchema.parse(config);
}
