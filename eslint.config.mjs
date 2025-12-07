/**
 * ESLint "Flat" Configuration
 * REFACTORED FOR MONOREPO PERFORMANCE
 *
 * This config is structured in layers to ensure a fast developer experience:
 * 1. Global Ignores: Files that ESLint should never touch.
 * 2. Fast Syntactic Linter: Runs on all JS/TS files. Handles formatting (Prettier),
 *    style, and basic errors. This is what runs instantly on save.
 * 3. Slow Type-Aware Linter: Runs ONLY on TypeScript files. It uses the
 *    TypeScript compiler to find complex, type-related bugs. This may take a
 *    second or two to complete in the background.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { configs, plugins, rules } from "eslint-config-airbnb-extended";
import { rules as prettierConfigRules } from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

// --- 1. SETUP ---

// Helper to get the project root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .gitignore to use its patterns in ESLint's ignores
const gitignorePath = path.resolve(__dirname, ".gitignore");
const gitignorePatterns = fs
	.readFileSync(gitignorePath, "utf8")
	.split("\n")
	.filter((line) => line && !line.startsWith("#"));

// --- 2. CONFIGURATION LAYERS ---

/**
 * LAYER 1: FAST Syntactic Config for ALL JavaScript and TypeScript files.
 * This handles formatting, style, and syntax-only rules. It runs instantly.
 */
const fastSyntacticConfig = {
	files: ["**/*.{js,mjs,cjs,ts,tsx}"],
	plugins: {
		// Your original plugins
		"@stylistic": plugins.stylistic.plugins["@stylistic"],
		"import-x": plugins.importX.plugins["import-x"],
		node: plugins.node,
		prettier: prettierPlugin,
		// Add TypeScript plugin here for syntax rules
		"@typescript-eslint": plugins.typescriptEslint.plugins["@typescript-eslint"],
	},
	languageOptions: {
		// Use the TypeScript parser for all files for consistency
		// It can parse JS and TS, and is required for TS syntax.
		parser: tsParser,
		parserOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			// CRITICAL: DO NOT add a 'project' property here.
			// That would make this layer slow.
		},
		globals: {
			...globals.node,
		},
	},
	rules: {
		// ESLint Recommended
		...js.configs.recommended.rules,
		// Airbnb Base + Node + TS (syntactic parts only)
		...configs.base.recommended.rules,
		...configs.node.recommended.rules,
		...configs.base.typescript.rules,
		// Strict Import Rules
		...rules.base.importsStrict.rules,
		// Prettier rules (must be last)
		...prettierConfigRules,
		"prettier/prettier": "error",
		"no-unused-vars": "off", // 1. Disable the base ESLint rule
		"@typescript-eslint/no-unused-vars": [
			"warn", // or "error"
			{
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
				caughtErrorsIgnorePattern: "^_",
			},
		],
	},
};

/**
 * LAYER 2: SLOW Type-Aware Config for TypeScript files ONLY.
 * This layer enables the powerful but slow rules that need to understand your
 * entire project's type system.
 */
const slowTypeAwareConfig = {
	files: ["services/**/*.ts", "packages/**/*.ts"], // Be specific to your source code
	languageOptions: {
		parserOptions: {
			// CRITICAL: The 'project' property enables type-aware linting.
			project: "./tsconfig.eslint.json",
			tsconfigRootDir: __dirname,
		},
	},
	rules: {
		// Apply ONLY the strict, type-aware ruleset here.
		...rules.typescript.typescriptEslintStrict.rules,
		// Disable prefer-nullish-coalescing rule
		"@typescript-eslint/prefer-nullish-coalescing": "off",
	},
};

/**
 * LAYER 3: Controller-specific Config
 * Disables the consistent-type-imports rule for controller files. This is
 * necessary because frameworks like NestJS use decorators that require the
 * actual class (a value) at runtime, even if the DTO is only used as a type
 * in the controller method signature.
 */
const controllerConfig = {
	files: [	],
	rules: {
		"@typescript-eslint/consistent-type-imports": "off",
	},
};

// --- 3. FINAL EXPORT ---

export default [
	// Global ignores
	{
		ignores: [
			"**/node_modules/**",
			"**/dist/**",
			"**/.turbo/**",
			"**/coverage/**",
			...gitignorePatterns,
		],
	},

	// Apply the fast layer
	fastSyntacticConfig,

	// Apply the slow layer on top
	slowTypeAwareConfig,

	controllerConfig,
];
