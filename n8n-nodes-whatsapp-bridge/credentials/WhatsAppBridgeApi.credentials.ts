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
			default: 'http://localhost:4000',
			placeholder: 'http://192.168.0.116:4000',
			description: 'WhatsApp Bridge service base URL (e.g., http://localhost:4000)',
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
			description: 'API key for authentication (optional, leave empty if not required)',
			required: false,
		},
	];
}
