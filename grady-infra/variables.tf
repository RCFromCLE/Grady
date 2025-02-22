variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region to deploy resources"
  type        = string
  default     = "eastus"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "grady"
    ManagedBy   = "terraform"
  }
}

variable "cosmos_db_throughput" {
  description = "The throughput of the SQL container (RU/s)"
  type        = number
  default     = 400
}

variable "function_app_sku" {
  description = "The SKU for the function app service plan"
  type        = string
  default     = "Y1" # Consumption plan
}

variable "static_web_app_sku" {
  description = "The SKU for the static web app"
  type        = string
  default     = "Free"
}
