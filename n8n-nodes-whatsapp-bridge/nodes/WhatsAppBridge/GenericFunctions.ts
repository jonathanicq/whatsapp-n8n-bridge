import { IExecuteFunctions, IWebhookFunctions, IHttpRequestMethods, IRequestOptions } from 'n8n-workflow';

export async function whatsappBridgeApiRequest(
	this: IExecuteFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: Record<string, any> = {},
	query: Record<string, string> = {},
): Promise<any> {
	const credentials = await this.getCredentials('whatsappBridgeApi');
	if (!credentials) {
		throw new Error('WhatsApp Bridge API credentials not configured');
	}

	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
	const apiKey = credentials.apiKey as string;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	// Only add API key header if provided
	if (apiKey && apiKey.trim()) {
		headers['x-api-key'] = apiKey;
	}

	const options: IRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers,
		json: true,
	};

	if (Object.keys(body).length > 0) {
		options.body = body;
	}

	if (Object.keys(query).length > 0) {
		options.qs = query;
	}

	try {
		const response = await this.helpers.request(options);
		return response;
	} catch (error) {
		throw new Error(
			`WhatsApp Bridge API error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
