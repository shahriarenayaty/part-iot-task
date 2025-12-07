import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AckPolicy, connect, DeliverPolicy, RetentionPolicy, StorageType, StringCodec } from "nats";

import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import type { JetStreamClient, NatsConnection } from "nats";
import { BaseEnvConfig } from "../config/env.config";
import {
	EVENT_SUBSCRIBER_METADATA_KEY,
	ON_EVENT_METADATA_KEY,
	PAYLOAD_METADATA_KEY,
	PAYLOAD_VALIDATION_METADATA_KEY,
} from "../utils/nat-decorator";

@Injectable()
export class EventDispatcherService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(EventDispatcherService.name);
	private natsConnection!: NatsConnection;
	private jetStreamClient!: JetStreamClient;
	private readonly codec = StringCodec();
	private readonly consumers: Array<{ streamName: string; consumerName: string }> = [];

	constructor(
		private readonly discoveryService: DiscoveryService,
		private readonly metadataScanner: MetadataScanner,
		private readonly reflector: Reflector,
		private readonly configService: ConfigService<BaseEnvConfig>,
	) {}

	async onModuleInit(): Promise<void> {
		await this.connectToNats();
		await this.initializeJetStream();
		await this.ensureDeadLetterStreamExists();
		this.subscribeToEvents();
	}

	async onModuleDestroy(): Promise<void> {
		// Delete all consumers before closing connection
		console.log("onModuleDestroy called in EventDispatcherService");
		console.log(`Consumers to clean up: ${this.consumers.length}`);
		if (this.consumers.length > 0) {
			this.logger.log(`Cleaning up ${this.consumers.length} consumer(s)...`);
			const jsm = await this.natsConnection.jetstreamManager();

			for (const { streamName, consumerName } of this.consumers) {
				try {
					await jsm.consumers.delete(streamName, consumerName);
					this.logger.log(
						`Deleted consumer '${consumerName}' from stream '${streamName}'`,
					);
				} catch (error) {
					this.logger.warn(
						`Failed to delete consumer '${consumerName}' from stream '${streamName}':`,
						error,
					);
				}
			}
		}

		if (this.natsConnection) {
			await this.natsConnection.drain();
			this.logger.log("NATS connection closed");
		}
	}

	private async connectToNats() {
		const natsUrl = this.configService.get("NATS_URL");
		if (!natsUrl) {
			this.logger.error("NATS_URL is not defined in the configuration.");
			return;
		}

		try {
			this.natsConnection = await connect({ servers: natsUrl });
			this.logger.log(`Connected to NATS at ${natsUrl}`);
		} catch (error) {
			this.logger.error("Failed to connect to NATS:", error);
		}
	}

	private async initializeJetStream() {
		try {
			this.jetStreamClient = this.natsConnection.jetstream();
			this.logger.log("JetStream client initialized");
		} catch (error) {
			this.logger.error("Failed to initialize JetStream:", error);
		}
	}

	private async ensureDeadLetterStreamExists() {
		const namespace = this.configService.get("NAMESPACE") || "";
		const deadLetterSubject = `${namespace}.DEAD_LETTER`;
		const streamName = `${namespace.replace(/\./g, "_")}_DEAD_LETTER`;

		try {
			const jsm = await this.natsConnection.jetstreamManager();
			try {
				await jsm.streams.info(streamName);
				this.logger.log(`Dead Letter Stream '${streamName}' found`);
			} catch {
				this.logger.log(`Dead Letter Stream '${streamName}' not found, creating it...`);
				await jsm.streams.add({
					name: streamName,
					subjects: [deadLetterSubject],
					retention: RetentionPolicy.Limits,
					storage: StorageType.File,
					num_replicas: 1,
				});
				this.logger.log(`Dead Letter Stream '${streamName}' created successfully`);
			}
		} catch (error) {
			this.logger.error(`Failed to ensure Dead Letter Stream '${streamName}':`, error);
		}
	}

	private subscribeToEvents() {
		const providers: InstanceWrapper[] = this.discoveryService.getProviders();
		const eventSubscribers = providers.filter(
			(wrapper) =>
				wrapper.instance &&
				// Add a guard to ensure metatype exists before using it
				wrapper.metatype &&
				this.reflector.get(EVENT_SUBSCRIBER_METADATA_KEY, wrapper.metatype),
		);

		for (const wrapper of eventSubscribers) {
			const instance = wrapper.instance;
			const prototype = Object.getPrototypeOf(instance);
			const methodNames = this.metadataScanner.getAllMethodNames(prototype);

			for (const methodName of methodNames) {
				const eventName = this.reflector.get<string>(
					ON_EVENT_METADATA_KEY,
					instance[methodName],
				);
				if (eventName) {
					this.handleEventSubscription(eventName, instance, methodName);
				}
			}
		}
	}

	private handleEventSubscription(eventName: string, instance: any, methodName: string) {
		const prototype = Object.getPrototypeOf(instance);
		const namespace = this.configService.get("NAMESPACE") || "";
		const serviceName = this.configService.get("SERVICE_NAME") || "unknown-service";
		const channelName = `${eventName}`;
		const streamName = `${eventName.replace(/\./g, "_")}`;
		const consumerName = `${serviceName}`;
		this.logger.log(
			`Subscribing to JetStream channel: ${channelName} on stream: ${streamName}`,
		);

		(async () => {
			try {
				const jsm = await this.natsConnection.jetstreamManager();

				try {
					await jsm.streams.info(streamName);
					this.logger.log(`Stream '${streamName}' found`);
				} catch {
					this.logger.log(`Stream '${streamName}' not found, creating it...`);
					try {
						await jsm.streams.add({
							name: streamName,
							subjects: [channelName],
							retention: RetentionPolicy.Limits,
							storage: StorageType.File,
							num_replicas: 1,
						});
						this.logger.log(`Stream '${streamName}' created successfully`);
					} catch (createError) {
						this.logger.error(`Failed to create stream '${streamName}':`, createError);
						throw createError;
					}
				}

				let consumer;
				try {
					consumer = await this.jetStreamClient.consumers.get(streamName, consumerName);
					this.logger.log(`Using existing consumer '${consumerName}'`);
				} catch {
					// Consumer doesn't exist, create it
					this.logger.log(
						`Creating consumer '${consumerName}' for channel '${channelName}'`,
					);
					await jsm.consumers.add(streamName, {
						durable_name: consumerName,
						filter_subject: channelName, // Only messages matching this exact subject
						ack_policy: AckPolicy.Explicit,
						deliver_policy: DeliverPolicy.Last,
						max_ack_pending: 10,
						max_waiting: 0,
						ack_wait: 30000000000, // 30 seconds in nanoseconds to wait for ack
					});
					consumer = await this.jetStreamClient.consumers.get(streamName, consumerName);
					this.logger.log(`Consumer '${consumerName}' created successfully`);
					this.consumers.push({ streamName, consumerName });
				}

				// Start consumin messages
				const messages = await consumer.consume({
					max_messages: 100, // Process up to 100 messages concurrently
				});

				this.logger.log(`Started consuming messages for channel: ${channelName}`);

				for await (const msg of messages) {
					try {
						const decodedData = JSON.parse(this.codec.decode(msg.data));
						const payload = decodedData.data || decodedData;

						const deliveryCount = msg.info.redeliveryCount || 0;
						const maxDeliveries = 3;

						this.logger.log(
							`Received message on channel '${channelName}' (delivery attempt: ${deliveryCount}/${maxDeliveries}):`,
							JSON.stringify(payload),
						);

						const payloadIndex = Reflect.getMetadata(
							PAYLOAD_METADATA_KEY,
							prototype,
							methodName,
						);
						const payloadValidationDto = Reflect.getMetadata(
							PAYLOAD_VALIDATION_METADATA_KEY,
							prototype,
							methodName,
						);
						const paramTypes = Reflect.getMetadata(
							"design:paramtypes",
							prototype,
							methodName,
						);

						if (payloadIndex !== undefined) {
							let payloadType = payloadValidationDto;
							if (!payloadType && paramTypes) {
								payloadType = paramTypes[payloadIndex];
							}

							if (payloadType) {
								const validatedPayload = plainToInstance(payloadType, payload);
								const errors = await validate(validatedPayload);
								if (errors.length > 0) {
									let humanReadableErrors = errors
										.map((err) =>
											Object.values(err.constraints || {}).join(", "),
										)
										.join("; ");
									this.logger.error(
										`Payload validation failed for event '${eventName}': ${humanReadableErrors}`,
									);

									// Send validation failures to dead letter immediately
									try {
										const deadLetterSubject = `${namespace}.DEAD_LETTER`;
										const deadLetterPayload = {
											originalSubject: msg.subject,
											originalData: this.codec.decode(msg.data),
											error: "Payload validation failed",
											validationErrors: errors,
											timestamp: new Date().toISOString(),
										};

										await this.jetStreamClient.publish(
											deadLetterSubject,
											this.codec.encode(JSON.stringify(deadLetterPayload)),
										);

										this.logger.log(
											`Validation failed message sent to dead letter: ${deadLetterSubject}`,
										);

										msg.ack(); // Acknowledge to remove from stream
									} catch (dlqError) {
										this.logger.error(
											"Failed to send validation error to dead letter:",
											dlqError,
										);
										msg.term();
									}

									continue;
								}
								const args = [];
								args[payloadIndex] = validatedPayload;
								await instance[methodName].apply(instance, args);
							} else {
								await instance[methodName].apply(instance, [payload]);
							}
						} else {
							await instance[methodName].apply(instance, [payload]);
						}

						// Successfully processed, acknowledge the message
						msg.ack();
						this.logger.log(
							`Successfully processed message for channel '${channelName}'`,
						);
					} catch (error) {
						const deliveryCount = msg.info.redeliveryCount || 0;
						const maxDeliveries = 3;

						this.logger.error(
							`Error processing JetStream message for event '${eventName}' (delivery attempt: ${deliveryCount}/${maxDeliveries}):`,
							error,
						);

						// Check if max delivery attempts reached
						if (deliveryCount >= maxDeliveries) {
							this.logger.error(
								`Max delivery attempts reached for '${channelName}'. Sending to dead letter.`,
							);

							// Publish to dead letter queue
							try {
								const deadLetterSubject = `${namespace}.DEAD_LETTER`;
								const deadLetterPayload = {
									originalSubject: msg.subject,
									originalData: this.codec.decode(msg.data),
									error: error instanceof Error ? error.message : String(error),
									errorStack: error instanceof Error ? error.stack : undefined,
									deliveryCount: deliveryCount,
									timestamp: new Date().toISOString(),
								};

								await this.jetStreamClient.publish(
									deadLetterSubject,
									this.codec.encode(JSON.stringify(deadLetterPayload)),
								);

								this.logger.log(
									`Message sent to dead letter: ${deadLetterSubject}`,
								);

								// Acknowledge original message to remove it from the stream
								msg.ack();
							} catch (dlqError) {
								this.logger.error("Failed to send to dead letter queue:", dlqError);
								// Still terminate the original message to prevent infinite loop
								msg.term();
							}
						} else {
							// Reject with delay to trigger redelivery
							this.logger.warn(
								`Rejecting message on '${channelName}' for retry (${deliveryCount + 1}/${maxDeliveries})`,
							);
							msg.nak(2000); // Reject with 2 second delay before redelivery
						}
					}
				}
			} catch (error) {
				this.logger.error(
					`Failed to subscribe to JetStream channel '${channelName}':`,
					error,
				);
			}
		})();
	}
}
