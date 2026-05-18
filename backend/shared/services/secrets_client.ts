import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-south-1' });
