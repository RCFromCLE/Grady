# Grady Math Infrastructure

This directory contains the infrastructure as code (IaC) for deploying the Grady Math application to Azure using Terraform.

## Architecture

The application consists of:
- Azure Static Web App: Hosts the React frontend
- Azure Functions: Serverless backend API
- Azure Cosmos DB: NoSQL database for worksheet storage
- Azure Key Vault: Secure secret storage
- Application Insights: Monitoring and telemetry
- Azure Storage Account: Required for Azure Functions

## Prerequisites

1. Azure CLI installed and logged in
2. Terraform CLI installed
3. Azure subscription with required permissions
4. GitHub repository with necessary secrets configured

## Required GitHub Secrets

Configure these secrets in your GitHub repository:

```
AZURE_CREDENTIALS              # Service principal credentials
AZURE_CLIENT_ID               # Service principal client ID
AZURE_CLIENT_SECRET           # Service principal client secret
AZURE_SUBSCRIPTION_ID         # Azure subscription ID
AZURE_TENANT_ID               # Azure tenant ID
AZURE_FUNCTIONAPP_PUBLISH_PROFILE  # Function app publish profile
AZURE_STATIC_WEB_APPS_API_TOKEN   # Static web app deployment token
```

## Initial Setup

1. Create a storage account for Terraform state:

```bash
# Login to Azure
az login

# Create resource group for Terraform state
az group create --name terraform-state-rg --location eastus

# Create storage account
az storage account create \
  --name gradytfstate \
  --resource-group terraform-state-rg \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name tfstate \
  --account-name gradytfstate
```

2. Create a service principal for GitHub Actions:

```bash
# Create service principal
az ad sp create-for-rbac --name "grady-github-actions" --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID \
  --sdk-auth

# Copy the output JSON - this will be your AZURE_CREDENTIALS secret
```

## Deployment

The infrastructure is deployed automatically via GitHub Actions when changes are pushed to the main branch. The workflow:

1. Builds and tests both the API and web app
2. Deploys infrastructure using Terraform
3. Deploys the API to Azure Functions
4. Deploys the web app to Azure Static Web Apps

## Manual Deployment

If you need to deploy manually:

```bash
# Initialize Terraform
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

## Infrastructure Variables

Key variables that can be customized:

- `environment`: Environment name (dev, prod, etc.)
- `location`: Azure region
- `cosmos_db_throughput`: Cosmos DB RU/s
- `function_app_sku`: Function app service plan SKU
- `static_web_app_sku`: Static web app SKU

## Important Outputs

After deployment, you'll get these outputs:

- `function_app_name`: Name of the deployed function app
- `static_web_app_url`: URL of the static web app
- `cosmos_db_endpoint`: Cosmos DB endpoint
- `key_vault_uri`: Key Vault URI

## Post-Deployment Steps

1. Configure the static web app's API settings with the function app URL
2. Add necessary secrets to Key Vault
3. Configure CORS settings if needed
4. Set up Application Insights monitoring

## Monitoring

- Use Application Insights for monitoring both the API and web app
- Set up alerts for key metrics
- Monitor Cosmos DB performance and costs

## Security

- All sensitive values are stored in Key Vault
- Function app uses managed identity
- Static web app uses authentication
- Cosmos DB uses server-side encryption

## Cost Management

The infrastructure uses:
- Serverless Functions (pay-per-execution)
- Serverless Cosmos DB (pay-per-request)
- Free tier Static Web App
- Standard Key Vault

Monitor costs in Azure Cost Management.

## Troubleshooting

Common issues:

1. Deployment Failures:
   - Check GitHub Actions logs
   - Verify service principal permissions
   - Check resource name conflicts

2. Runtime Issues:
   - Check Application Insights logs
   - Verify Cosmos DB connection
   - Check Function app settings

## Support

For issues:
1. Check Application Insights
2. Review GitHub Actions logs
3. Check Azure resource logs
4. Verify configuration in Azure Portal
