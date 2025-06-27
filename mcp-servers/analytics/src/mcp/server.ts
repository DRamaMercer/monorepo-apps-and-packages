import { Hono } from 'hono';
import { z } from 'zod';
import logger from '../utils/logger';
import { environment } from '../utils/environment';
import {
  MCPTool,
  MCPResource,
  MCPService, // Changed from MCPServer
  ServerConfig, // New import
} from '@modelcontextprotocol/runtime';

// Define schemas for tools
const trackEventToolSchema = z.object({
  eventName: z.string().min(1),
  userId: z.string().optional(),
  properties: z.record(z.any()).optional(),
});

const getAnalyticsReportToolSchema = z.object({
  reportType: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Define schemas for resources
const analyticsReportResourceSchema = z.object({
  id: z.string().uuid(),
  reportType: z.enum(['daily', 'weekly', 'monthly']),
  data: z.record(z.any()),
  generatedAt: z.string().datetime(),
});

class AnalyticsService extends MCPService {
  constructor(app: Hono, config: ServerConfig) {
    super(app, config);
    // Removed redundant this.name, this.version, this.description assignments

    this.registerTools([
      new MCPTool({
        name: 'track_event',
        description: 'Tracks a custom analytics event.',
        inputSchema: trackEventToolSchema,
        func: async (input: any, context?: any) => { // Explicitly type input
          logger.info('Tracking event:', input.eventName, input.properties);
          // In a real scenario, this would send data to an analytics platform (e.g., Mixpanel, Google Analytics)
          return { success: true, eventId: `event-${Date.now()}` };
        },
      }),
      new MCPTool({
        name: 'get_analytics_report',
        description: 'Generates and retrieves an analytics report.',
        inputSchema: getAnalyticsReportToolSchema,
        func: async (input: any, context?: any) => { // Explicitly type input
          logger.info('Generating analytics report:', input.reportType);
          // Simulate fetching/generating a report
          return {
            reportId: `report-${Date.now()}`,
            reportType: input.reportType,
            data: {
              users: 1000,
              events: 5000,
              // ... more simulated data
            },
          };
        },
      }),
    ]);

    this.registerResources([
      new MCPResource({
        name: 'report',
        description: 'Represents an analytics report.',
        schema: analyticsReportResourceSchema, // Added schema
        get: async (uri: string, context?: any) => { // Explicitly type uri
          logger.info('Fetching analytics report resource for URI:', uri);
          const reportId = uri.split('/').pop();
          if (!reportId) {
            throw new Error('Invalid report URI');
          }
          return {
            id: reportId,
            reportType: 'daily', // Simulated
            data: { message: `Simulated daily report for ${reportId}` },
            generatedAt: new Date().toISOString(),
          };
        },
      }),
    ]);

    logger.info(`Analytics MCP Server initialized on port ${environment.PORT}`);
  }
}

/**
 * Create and configure the MCP server instance
 */
export async function createMCPServer(): Promise<Hono> {
  const app = new Hono();

  const config: ServerConfig = {
    name: 'analytics',
    description: 'MCP Server for collecting and reporting analytics data.',
    version: '1.0.0',
  };

  const analyticsService = new AnalyticsService(app, config);
  await analyticsService.initialize(); // Call initialize on the service instance

  return app;
}
