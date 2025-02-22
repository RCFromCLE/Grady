# Math Worksheet API Documentation

## Overview
The Math Worksheet API is deployed on Azure and provides endpoints for generating math worksheets, processing submissions, and exporting grades. The system is built with security, monitoring, and cost optimization in mind.

## Infrastructure

### Azure Resources (Central US)
- **Functions App**: `func-grady-dev`
- **Cosmos DB**: Serverless configuration
- **Form Recognizer**: F0 tier
- **Application Insights**: Integrated monitoring
- **Azure AD**: Authentication provider
- **Storage**: LRS Storage Account

## API Endpoints

```
https://func-grady-dev.azurewebsites.net/api/GenerateWorksheet
https://func-grady-dev.azurewebsites.net/api/ProcessSubmission
https://func-grady-dev.azurewebsites.net/api/ExportGrades
```

## Monitoring & Management

### Application Insights
- **Dashboard**: Performance metrics, request tracking, error monitoring
- **Live Metrics**: Real-time function execution monitoring
- **Custom Events**: Business metric tracking
- **Exception Tracking**: Automatic error logging and alerting

### Azure Portal Access
- **Portal URL**: https://portal.azure.com
- **Resource Group**: rg-grady-dev-centralus
- **Application Insights**: appi-grady-dev

## Security Implementation

- Azure AD Authentication enabled
- Secure key storage in Azure Key Vault
- CORS configuration in place
- Service Principal with 1-year credential rotation

## Cost Optimization

The infrastructure is optimized for cost-effective operation:
- Serverless Cosmos DB scaling
- Consumption plan for Azure Functions
- Form Recognizer Free tier (F0)
- LRS Storage Account for minimal redundancy costs

## Local Development

### Setup
1. Configure `local.settings.json` with appropriate values
2. Install Azure Functions Core Tools
3. Enable Application Insights for local debugging

### Testing
- Use provided mock services for local testing
- Run integration tests against development endpoints
- Monitor local execution through Application Insights

## CI/CD Roadmap

Planned improvements for the deployment pipeline:
1. GitHub Actions/Azure DevOps integration
2. Automated testing implementation
3. Staging environment configuration

## Resource Management

All resources are deployed in the `rg-grady-dev-centralus` resource group for centralized management. Use Azure Portal for:
- Monitoring resource health
- Reviewing performance metrics
- Managing security settings
- Analyzing cost data

## Best Practices

1. **Monitoring**:
   - Regularly review Application Insights dashboards
   - Set up alerts for critical metrics
   - Monitor cost accumulation

2. **Security**:
   - Rotate credentials according to schedule
   - Review CORS settings periodically
   - Monitor Azure AD access logs

3. **Development**:
   - Use local development environment for testing
   - Follow proper versioning practices
   - Document API changes

## Support

For issues or assistance:
1. Check Application Insights for error details
2. Review Azure Function logs
3. Monitor Cosmos DB performance metrics
