targetScope = 'resourceGroup'

@description('Project name (lowerCamelCase)')
param projectName string = 'glassbox'

@description('Azure region')
param location string = 'northeurope'

@description('Azure region for Cosmos DB (separate because SWA-supported regions can be capacity-constrained for Cosmos serverless)')
param cosmosLocation string = location

@description('Custom domain (optional)')
param customDomain string = ''

var tags = {
  project: projectName
  managedBy: 'bicep'
  costCenter: 'naurolabs-research'
}

module monitoring '../../.github/infrastructure/modules/monitoring.bicep' = {
  name: 'monitoring-${projectName}'
  params: {
    projectName: projectName
    location: location
    tags: tags
  }
}

module swa '../../.github/infrastructure/modules/swa.bicep' = {
  name: 'swa-${projectName}'
  params: {
    projectName: projectName
    location: location
    customDomain: customDomain
    tags: tags
  }
}

// ---------------------------------------------------------------------------
// Cosmos DB — serverless. Local auth (key) stays ENABLED because SWA Free has no
// managed identity; the API reads COSMOS_KEY from encrypted SWA App Settings.
// The whole board is stored as a single document (single-user experiment).
// ---------------------------------------------------------------------------
var cosmosAccountName = '${projectName}-cosmos-${uniqueString(resourceGroup().id, projectName)}'

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-12-01-preview' = {
  name: cosmosAccountName
  location: cosmosLocation
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    capacityMode: 'Serverless'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      { locationName: cosmosLocation, failoverPriority: 0, isZoneRedundant: false }
    ]
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    minimalTlsVersion: 'Tls12'
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-12-01-preview' = {
  parent: cosmos
  name: 'glassbox'
  properties: {
    resource: { id: 'glassbox' }
  }
}

resource boardContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-12-01-preview' = {
  parent: cosmosDb
  name: 'board'
  properties: {
    resource: {
      id: 'board'
      partitionKey: {
        paths: [ '/id' ]
        kind: 'Hash'
      }
    }
  }
}

output swaHostname string = swa.outputs.defaultHostname
output appInsightsConnectionString string = monitoring.outputs.connectionString
output cosmosEndpoint string = cosmos.properties.documentEndpoint
output cosmosAccountName string = cosmos.name
