terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "gradytfstate"
    container_name      = "tfstate"
    key                 = "grady.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "grady-${var.environment}-rg"
  location = var.location
  tags     = var.tags
}

# Cosmos DB
resource "azurerm_cosmosdb_account" "main" {
  name                = "grady-${var.environment}-cosmos"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type         = "Standard"
  kind               = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }
}

resource "azurerm_cosmosdb_sql_database" "main" {
  name                = "grady-db"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "worksheets" {
  name                = "worksheets"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/teacherId"
}

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "grady${var.environment}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# App Service Plan for Functions
resource "azurerm_service_plan" "main" {
  name                = "grady-${var.environment}-asp"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  os_type            = "Windows"
  sku_name           = "Y1" # Consumption plan
}

# Function App
resource "azurerm_windows_function_app" "main" {
  name                       = "grady-${var.environment}-func"
  resource_group_name        = azurerm_resource_group.main.name
  location                  = azurerm_resource_group.main.location
  storage_account_name      = azurerm_storage_account.main.name
  storage_account_access_key = azurerm_storage_account.main.primary_access_key
  service_plan_id           = azurerm_service_plan.main.id

  site_config {
    application_stack {
      node_version = "18"
    }
    cors {
      allowed_origins = ["*"]
    }
  }

  app_settings = {
    COSMOS_DB_CONNECTION_STRING = azurerm_cosmosdb_account.main.connection_strings[0]
    COSMOS_DB_NAME             = azurerm_cosmosdb_sql_database.main.name
    WEBSITE_NODE_DEFAULT_VERSION = "~18"
    FUNCTIONS_WORKER_RUNTIME    = "node"
  }
}

# Static Web App
resource "azurerm_static_site" "web" {
  name                = "grady-${var.environment}-web"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  sku_tier           = "Free"
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "grady-${var.environment}-appinsights"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                = "grady-${var.environment}-kv"
  location           = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id          = data.azurerm_client_config.current.tenant_id
  sku_name           = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete"
    ]
  }
}

# Get current Azure context
data "azurerm_client_config" "current" {}
