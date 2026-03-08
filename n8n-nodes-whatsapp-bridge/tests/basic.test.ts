/**
 * Basic smoke tests to verify the node package structure is correct
 */

import { WhatsAppBridge } from '../nodes/WhatsAppBridge/WhatsAppBridge.node';
import { WhatsAppBridgeTrigger } from '../nodes/WhatsAppBridge/WhatsAppBridgeTrigger.node';
import { WhatsAppBridgeApi } from '../credentials/WhatsAppBridgeApi.credentials';

describe('n8n WhatsApp Bridge Nodes - Smoke Tests', () => {
	describe('Node Classes', () => {
		it('should instantiate WhatsAppBridge node', () => {
			const node = new WhatsAppBridge();
			expect(node).toBeDefined();
			expect(node.description).toBeDefined();
			expect(node.description.name).toBe('whatsappBridge');
		});

		it('should instantiate WhatsAppBridgeTrigger node', () => {
			const node = new WhatsAppBridgeTrigger();
			expect(node).toBeDefined();
			expect(node.description).toBeDefined();
			expect(node.description.name).toBe('whatsappBridgeTrigger');
		});

		it('should instantiate WhatsAppBridgeApi credential', () => {
			const cred = new WhatsAppBridgeApi();
			expect(cred).toBeDefined();
			expect(cred.name).toBe('whatsappBridgeApi');
			expect(cred.displayName).toBe('WhatsApp Bridge API');
			expect(cred.properties).toBeDefined();
			expect(cred.properties.length).toBeGreaterThan(0);
		});
	});

	describe('WhatsAppBridge Node Structure', () => {
		const node = new WhatsAppBridge();

		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('WhatsApp Bridge');
		});

		it('should be an output node', () => {
			expect(node.description.group).toContain('output');
		});

		it('should require WhatsApp Bridge credentials', () => {
			const creds = node.description.credentials;
			expect(creds).toBeDefined();
			const whatsappCred = creds?.find((c) => c.name === 'whatsappBridgeApi');
			expect(whatsappCred).toBeDefined();
			expect(whatsappCred?.required).toBe(true);
		});

		it('should have operation property', () => {
			const operationProp = node.description.properties?.find((p) => p.name === 'operation');
			expect(operationProp).toBeDefined();
			expect(operationProp?.type).toBe('options');
		});

		it('should support all required operations', () => {
			const operationProp = node.description.properties?.find((p) => p.name === 'operation');
			const options = (operationProp as any)?.options || [];
			const operationValues = options.map((o: any) => o.value);

			expect(operationValues).toContain('sendMessage');
			expect(operationValues).toContain('queueMessage');
			expect(operationValues).toContain('getStatus');
			expect(operationValues).toContain('getWebhooks');
		});

		it('should have phone number and message text properties', () => {
			const toProp = node.description.properties?.find((p) => p.name === 'to');
			const textProp = node.description.properties?.find((p) => p.name === 'text');

			expect(toProp).toBeDefined();
			expect(toProp?.type).toBe('string');
			expect(textProp).toBeDefined();
			expect(textProp?.type).toBe('string');
		});

		it('should have execute method', () => {
			expect(typeof node.execute).toBe('function');
		});
	});

	describe('WhatsAppBridgeTrigger Node Structure', () => {
		const node = new WhatsAppBridgeTrigger();

		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('WhatsApp Bridge Trigger');
		});

		it('should be a trigger node', () => {
			expect(node.description.group).toContain('trigger');
		});

		it('should require WhatsApp Bridge credentials', () => {
			const creds = node.description.credentials;
			expect(creds).toBeDefined();
			const whatsappCred = creds?.find((c) => c.name === 'whatsappBridgeApi');
			expect(whatsappCred).toBeDefined();
			expect(whatsappCred?.required).toBe(true);
		});

		it('should have webhook methods defined', () => {
			expect(node.webhookMethods).toBeDefined();
			expect(node.webhookMethods.default).toBeDefined();
			expect(typeof node.webhookMethods.default.checkExists).toBe('function');
			expect(typeof node.webhookMethods.default.create).toBe('function');
			expect(typeof node.webhookMethods.default.delete).toBe('function');
		});

		it('should have webhook handler', () => {
			expect(typeof node.webhook).toBe('function');
		});
	});

	describe('Credential Type Structure', () => {
		const cred = new WhatsAppBridgeApi();

		it('should have base URL property', () => {
			const baseUrlProp = cred.properties.find((p) => p.name === 'baseUrl');
			expect(baseUrlProp).toBeDefined();
			expect(baseUrlProp?.type).toBe('string');
			expect(baseUrlProp?.required).toBe(true);
		});

		it('should have API key property', () => {
			const apiKeyProp = cred.properties.find((p) => p.name === 'apiKey');
			expect(apiKeyProp).toBeDefined();
			expect(apiKeyProp?.type).toBe('string');
			expect(apiKeyProp?.required).toBe(true);
			expect((apiKeyProp?.typeOptions as any)?.password).toBe(true);
		});
	});
});
