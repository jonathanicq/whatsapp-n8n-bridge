import { ICredentialType, INodeType } from 'n8n-workflow';
import { WhatsAppBridgeApi } from './credentials/WhatsAppBridgeApi.credentials';
import { WhatsAppBridge } from './nodes/WhatsAppBridge/WhatsAppBridge.node';
import { WhatsAppBridgeTrigger } from './nodes/WhatsAppBridge/WhatsAppBridgeTrigger.node';

export const CREDENTIALS: Array<new () => ICredentialType> = [WhatsAppBridgeApi];

export const NODES: Array<new () => INodeType> = [WhatsAppBridge, WhatsAppBridgeTrigger];
