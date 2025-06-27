/**
 * Constants for the Multi-Brand AI Agent System
 */
export const BRANDS = {
    SAITHAVYS: 'saithavys',
    PARTLY_OFFICE: 'partly-office',
    G_PRISMO: 'g-prismo',
};
export const BRAND_NAMES = {
    [BRANDS.SAITHAVYS]: 'SaithavyS',
    [BRANDS.PARTLY_OFFICE]: 'Partly Office',
    [BRANDS.G_PRISMO]: 'G Prismo',
};
export const MCP_SERVERS = {
    BRAND_CONTEXT: 'brand-context',
    CONTENT_GENERATION: 'content-generation',
    ANALYTICS: 'analytics',
    ASSET_MANAGEMENT: 'asset-management',
    WORKFLOW_ORCHESTRATION: 'workflow-orchestration',
};
export const API_ENDPOINTS = {
    HEALTH: '/health',
    BRANDS: '/api/brands',
    MCP_STATUS: '/api/mcp/status',
};
export const DEFAULT_PORTS = {
    WEB: 3000,
    API: 3001,
    BRAND_CONTEXT_MCP: 3002,
    CONTENT_GENERATION_MCP: 3003,
    ANALYTICS_MCP: 3004,
    ASSET_MANAGEMENT_MCP: 3005,
    WORKFLOW_ORCHESTRATION_MCP: 3006,
};
//# sourceMappingURL=constants.js.map