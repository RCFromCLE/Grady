output "function_app_name" {
  value = azurerm_windows_function_app.main.name
}

output "function_app_default_hostname" {
  value = azurerm_windows_function_app.main.default_hostname
}

output "static_web_app_name" {
  value = azurerm_static_site.web.name
}

output "static_web_app_url" {
  value = azurerm_static_site.web.default_host_name
}

output "cosmos_db_endpoint" {
  value = azurerm_cosmosdb_account.main.endpoint
}

output "application_insights_instrumentation_key" {
  value     = azurerm_application_insights.main.instrumentation_key
  sensitive = true
}

output "key_vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "cosmos_db_connection_string" {
  value     = azurerm_cosmosdb_account.main.connection_strings[0]
  sensitive = true
}

output "cosmos_db_name" {
  value = azurerm_cosmosdb_sql_database.main.name
}

output "cosmos_db_container_name" {
  value = azurerm_cosmosdb_sql_container.worksheets.name
}
