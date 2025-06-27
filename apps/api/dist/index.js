import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
const app = new Hono();
// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
// Health check endpoint
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Multi-Brand AI Agent API'
    });
});
// API routes
app.get('/api/brands', (c) => {
    return c.json({
        brands: [
            {
                id: 'saithavys',
                name: 'SaithavyS',
                description: 'Personal brand management and content generation',
                status: 'active'
            },
            {
                id: 'partly-office',
                name: 'Partly Office',
                description: 'Professional services and business content',
                status: 'active'
            },
            {
                id: 'g-prismo',
                name: 'G Prismo',
                description: 'Technology and innovation content',
                status: 'active'
            }
        ]
    });
});
// Brand-specific endpoints
app.get('/api/brands/:brandId', (c) => {
    const brandId = c.req.param('brandId');
    // Mock brand data - will be replaced with actual brand context management
    const brandData = {
        id: brandId,
        name: brandId.charAt(0).toUpperCase() + brandId.slice(1),
        context: {
            voice: 'Professional and engaging',
            style: 'Modern and accessible',
            audience: 'General audience'
        },
        metrics: {
            contentGenerated: 0,
            lastActivity: new Date().toISOString()
        }
    };
    return c.json(brandData);
});
// MCP Server status endpoint
app.get('/api/mcp/status', (c) => {
    return c.json({
        servers: [
            { name: 'brand-context', status: 'pending', port: 3001 },
            { name: 'content-generation', status: 'pending', port: 3002 },
            { name: 'analytics', status: 'pending', port: 3003 },
            { name: 'asset-management', status: 'pending', port: 3004 },
            { name: 'workflow-orchestration', status: 'pending', port: 3005 }
        ]
    });
});
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
console.log(`🚀 Multi-Brand AI Agent API Server starting on port ${port}`);
serve({
    fetch: app.fetch,
    port
});
//# sourceMappingURL=index.js.map