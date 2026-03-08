import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IHookFunctions,
	IWebhookResponseData,
	IDataObject,
	NodeOperationError,
	INodeExecutionData,
} from 'n8n-workflow';
import { createHmac } from 'crypto';
import { whatsappBridgeApiRequest } from './GenericFunctions';

export class WhatsAppBridgeTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp Bridge Trigger',
		name: 'whatsappBridgeTrigger',
		group: ['trigger'],
		version: 1,
		description: 'Trigger workflow when a WhatsApp message is received',
		defaults: {
			name: 'WhatsApp Bridge Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'whatsappBridgeApi',
				required: true,
			},
		],
		properties: [],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | undefined;
				return !!webhookId;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				if (!webhookUrl) {
					throw new Error('Failed to generate webhook URL');
				}

				const workflowId = this.getWorkflow().id;
				const webhookSecret = createHmac('sha256', 'whatsapp-bridge-secret')
					.update(webhookUrl)
					.digest('hex');

				try {
					const response = await whatsappBridgeApiRequest.call(this as any, 'POST', '/webhooks', {
						name: `n8n-${workflowId}`,
						url: webhookUrl,
						secret: webhookSecret,
					});

					// Store webhook ID and secret in static data for later use
					const staticData = this.getWorkflowStaticData('node');
					staticData.webhookId = response.id;
					staticData.webhookSecret = webhookSecret;

					return true;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to register webhook: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookId = staticData.webhookId as string | undefined;

				if (!webhookId) {
					// Webhook ID not found, possibly never activated
					return true;
				}

				try {
					await whatsappBridgeApiRequest.call(this as any, 'DELETE', `/webhooks/${webhookId}`);
					const staticData = this.getWorkflowStaticData('node');
					delete staticData.webhookId;
					delete staticData.webhookSecret;
					return true;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to deregister webhook: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const staticData = this.getWorkflowStaticData('node');
		const webhookSecret = staticData.webhookSecret as string | undefined;

		// Get the signature from headers
		const signature = req.headers['x-webhook-signature'] as string | undefined;
		if (!signature) {
			return {
				noWebhookResponse: true,
			};
		}

		// Get raw body for signature verification
		const rawBody = JSON.stringify(req.body);

		// Verify HMAC signature
		if (webhookSecret) {
			const expectedSig =
				'sha256=' +
				createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

			if (signature !== expectedSig) {
				return {
					noWebhookResponse: true,
				};
			}
		}

		// If signature is valid, return the message data
		const body = req.body as IDataObject;
		const messageData = (body.data || body) as IDataObject;

		const returnData: INodeExecutionData = {
			json: messageData,
		};

		return {
			workflowData: [[returnData]],
		};
	}
}
