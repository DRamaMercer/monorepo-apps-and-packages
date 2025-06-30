import { logger } from './logger'; // Assuming a logger exists or will be created in apps/api/src/utils

export interface McpToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any; // Allow other properties returned by tools
}

/**
 * Calls a generic MCP tool.
 * @param mcpBaseUrl The base URL of the MCP server.
 * @param toolName The name of the tool to call.
 * @param input The input data for the tool.
 * @returns A promise that resolves to the tool's response.
 */
export async function callMcpTool<T = any>(
  mcpBaseUrl: string,
  toolName: string,
  input: any,
): Promise<McpToolResponse<T>> {
  const toolUrl = `${mcpBaseUrl}/mcp/tool/${toolName}`;

  logger.info(`Calling MCP tool: ${toolUrl} with input:`, input);

  try {
    const response = await fetch(toolUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`MCP tool call failed with status ${response.status}: ${errorText}`, { toolUrl, input });
      return {
        success: false,
        error: `MCP tool call failed: ${response.status} ${response.statusText}. Details: ${errorText}`,
      };
    }

    const responseData: McpToolResponse<T> = await response.json();
    logger.info(`MCP tool response from ${toolUrl}:`, responseData);

    // Ensure the response conforms to the expected McpToolResponse structure
    if (typeof responseData.success !== 'boolean') {
        logger.warn(`MCP tool response from ${toolUrl} is missing 'success' field or has incorrect type.`, responseData);
        // We might still pass it through but flag it, or consider it an error
        // For now, let's assume if it parses, it's intended, but this is a weak point of generic clients.
    }

    return responseData;

  } catch (error: any) {
    logger.error(`Error calling MCP tool ${toolUrl}: ${error.message}`, { error, input });
    return {
      success: false,
      error: `Network or parsing error calling MCP tool: ${error.message}`,
    };
  }
}

/**
 * Fetches MCP server info.
 * @param mcpBaseUrl The base URL of the MCP server.
 * @returns A promise that resolves to the server's info or an error object.
 */
export async function getMcpServerInfo(mcpBaseUrl: string): Promise<McpToolResponse<any>> {
  const infoUrl = `${mcpBaseUrl}/mcp/info`;
  logger.info(`Fetching MCP server info from: ${infoUrl}`);

  try {
    const response = await fetch(infoUrl, { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Failed to fetch MCP info from ${infoUrl}: ${response.status} ${errorText}`);
      return {
        success: false,
        error: `Failed to fetch MCP info: ${response.status} ${response.statusText}. Details: ${errorText}`,
      };
    }
    const infoData = await response.json();
    logger.info(`MCP server info from ${infoUrl}:`, infoData);
    return { success: true, data: infoData };
  } catch (error: any) {
    logger.error(`Error fetching MCP info from ${infoUrl}: ${error.message}`, { error });
    return {
      success: false,
      error: `Network or parsing error fetching MCP info: ${error.message}`,
    };
  }
}
