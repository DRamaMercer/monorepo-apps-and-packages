/**
 * Constants for the Multi-Brand AI Agent System
 */

export const BRANDS = {
  SAITHAVYS: 'saithavys',
  PARTLY_OFFICE: 'partly-office',
  G_PRISMO: 'g-prismo',
  DEFAULT: 'default', // Added default brand
} as const

export const BRAND_NAMES = {
  [BRANDS.SAITHAVYS]: 'SaithavyS',
  [BRANDS.PARTLY_OFFICE]: 'Partly Office',
  [BRANDS.G_PRISMO]: 'G Prismo',
  [BRANDS.DEFAULT]: 'Default', // Added default brand name
} as const

export const MCP_SERVERS = {
  BRAND_CONTEXT: 'brand-context',
  CONTENT_GENERATION: 'content-generation',
  ANALYTICS: 'analytics',
  ASSET_MANAGEMENT: 'asset-management',
  WORKFLOW_ORCHESTRATION: 'workflow-orchestration',
} as const

export const API_ENDPOINTS = {
  HEALTH: '/health',
  BRANDS: '/api/brands',
  MCP_STATUS: '/api/mcp/status',
} as const

export const DEFAULT_PORTS = {
  WEB: 3000,
  API: 3001,
  BRAND_CONTEXT_MCP: 3002,
  CONTENT_GENERATION_MCP: 3003,
  ANALYTICS_MCP: 3004,
  ASSET_MANAGEMENT_MCP: 3005,
  WORKFLOW_ORCHESTRATION_MCP: 3006,
  AGENT_ORCHESTRATION_MCP: 3020, // Default port from its index.ts
  GENERIC_MCP: 3007,             // Default port from its index.ts
} as const
