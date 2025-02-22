import * as appInsights from 'applicationinsights';
import { CosmosClient } from '@azure/cosmos';
import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';

// Initialize Application Insights
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, false)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .start();
}

const telemetryClient = appInsights.defaultClient;

// Singleton instances
let cosmosClientInstance: CosmosClient;
let formRecognizerClientInstance: DocumentAnalysisClient;

// Function to initialize clients if not already initialized
function initializeClients() {
    if (cosmosClientInstance && formRecognizerClientInstance) {
        return;
    }

    telemetryClient?.trackEvent({
        name: 'InitializeClients'
    });

    if (!process.env.COSMOS_ENDPOINT || !process.env.COSMOS_KEY) {
        throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required');
    }

    if (!process.env.FORM_RECOGNIZER_ENDPOINT || !process.env.FORM_RECOGNIZER_KEY) {
        throw new Error('FORM_RECOGNIZER_ENDPOINT and FORM_RECOGNIZER_KEY environment variables are required');
    }

    cosmosClientInstance = new CosmosClient({
        endpoint: process.env.COSMOS_ENDPOINT,
        key: process.env.COSMOS_KEY
    });

    formRecognizerClientInstance = new DocumentAnalysisClient(
        process.env.FORM_RECOGNIZER_ENDPOINT,
        new AzureKeyCredential(process.env.FORM_RECOGNIZER_KEY)
    );
}

// Function to get the clients
export function getClients() {
    initializeClients();
    return {
        cosmosClient: cosmosClientInstance,
        formRecognizerClient: formRecognizerClientInstance
    };
}
