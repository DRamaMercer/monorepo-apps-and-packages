import { Hono } from 'hono';
export interface ServerConfig {
    name: string;
    description: string;
    version: string;
}
export declare class MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    handler: (input: any, context?: any) => Promise<any>;
    constructor(options: {
        name: string;
        description: string;
        inputSchema: any;
        func: (input: any, context?: any) => Promise<any>;
    });
}
export declare class MCPResource {
    name: string;
    description: string;
    schema: any;
    handler: (uri: string, context?: any) => Promise<any>;
    constructor(options: {
        name: string;
        description: string;
        schema: any;
        get: (uri: string, context?: any) => Promise<any>;
    });
}
export declare abstract class MCPService {
    name: string;
    version: string;
    description: string;
    protected app: Hono;
    private tools;
    private resources;
    constructor(app: Hono, config: ServerConfig);
    protected registerTools(tools: MCPTool[]): void;
    protected registerResources(resources: MCPResource[]): void;
    handleHttpRequest(request: any): Promise<any>;
    initialize(): Promise<void>;
}
export declare function createServer(config: ServerConfig): Hono;
//# sourceMappingURL=index.d.ts.map