import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({ logger: true }),
		{
			bufferLogs: true,
		},
	);

	const config = new DocumentBuilder()
		.setTitle("Part io API")
		.setDescription("The Part io API description")
		.setVersion("1.0")
		.addGlobalParameters({
			name: "Accept-Language",
			in: "header",
			description: "Language for localization",
			schema: {
				type: "string",
				enum: ["en", "fa"], // This creates the dropdown with specific values
				default: "en",
			},
			required: false,
		})
		.addBearerAuth(
			{
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
				in: "header",
				name: "Authorization",
				description: "Enter JWT token here",
			},
			"Authentication", // This is the name of your security scheme in Swagger UI
		)

		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, documentFactory);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);

	app.setGlobalPrefix("v1");

	// Enable CORS for all origins
	app.enableCors({
		origin: true, // Accepts all origins
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"Accept",
			"X-Requested-With",
			"Accept-Language",
		],
	});

	// const reflector = app.get(Reflector);

	// app.useGlobalGuards(new JwtAuthGuard(), new AuthGuard(reflector));

	await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
}
bootstrap();
