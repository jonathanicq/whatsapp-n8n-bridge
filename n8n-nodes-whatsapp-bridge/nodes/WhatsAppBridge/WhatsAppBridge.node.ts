import {
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
} from 'n8n-workflow';

import { whatsappBridgeApiRequest } from './GenericFunctions';

export class WhatsAppBridge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp Bridge',
		name: 'whatsappBridge',
		group: ['output'],
		version: 1,
		description: 'Send messages and manage WhatsApp via WhatsApp Bridge service',
		defaults: {
			name: 'WhatsApp Bridge',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'whatsappBridgeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a message immediately',
						action: 'Send a message',
					},
					{
						name: 'Queue Message',
						value: 'queueMessage',
						description: 'Queue a message for delivery',
						action: 'Queue a message',
					},
					{
						name: 'Get Status',
						value: 'getStatus',
						description: 'Get WhatsApp connection status',
						action: 'Get WhatsApp status',
					},
					{
						name: 'Get Webhooks',
						value: 'getWebhooks',
						description: 'List all registered webhooks',
						action: 'Get registered webhooks',
					},
				],
				default: 'sendMessage',
			},
			// Send and Queue Message fields
			{
				displayName: 'Phone Number',
				name: 'to',
				type: 'string',
				default: '',
				placeholder: '+1234567890',
				description: 'Recipient phone number in E.164 format (e.g., +1234567890)',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage', 'queueMessage'],
					},
				},
			},
			{
				displayName: 'Message Text',
				name: 'text',
				type: 'string',
				default: '',
				placeholder: 'Hello, this is a test message',
				description: 'Message text to send',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMessage', 'queueMessage'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let response: IDataObject;

				if (operation === 'sendMessage') {
					const to = this.getNodeParameter('to', i) as string;
					const text = this.getNodeParameter('text', i) as string;

					response = await whatsappBridgeApiRequest.call(this, 'POST', '/whatsapp/send', {
						to,
						text,
					});
				} else if (operation === 'queueMessage') {
					const to = this.getNodeParameter('to', i) as string;
					const text = this.getNodeParameter('text', i) as string;

					response = await whatsappBridgeApiRequest.call(this, 'POST', '/queue/send', {
						to,
						text,
					});
				} else if (operation === 'getStatus') {
					response = await whatsappBridgeApiRequest.call(this, 'GET', '/whatsapp/status');
				} else if (operation === 'getWebhooks') {
					response = await whatsappBridgeApiRequest.call(this, 'GET', '/webhooks');
				} else {
					throw new Error(`Unknown operation: ${operation}`);
				}

				returnData.push({ json: response });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
