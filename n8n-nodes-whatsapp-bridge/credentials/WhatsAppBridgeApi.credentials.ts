import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class WhatsAppBridgeApi implements ICredentialType {
	name = 'whatsappBridgeApi';
	displayName = 'WhatsApp Bridge API';
	documentationUrl = 'https://github.com/jonathanicq/whatsapp-n8n-bridge';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://localhost:3000',
			placeholder: 'http://192.168.0.116:3000',
			description: 'WhatsApp Bridge service base URL',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for authentication with WhatsApp Bridge',
			required: true,
		},
	];
}
