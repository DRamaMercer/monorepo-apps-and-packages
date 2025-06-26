# AI Agent Orchestration Layer

This MCP server provides a robust orchestration layer for managing AI agents in a multi-brand system. It handles task queuing, agent management, and workflow orchestration for the entire system.

## Overview

The AI Agent Orchestration Layer serves as the central coordination system for all AI agents in the platform. It enables:

- Management of different types of specialized AI agents
- Reliable task queuing and execution
- Multi-step workflow orchestration
- Brand context awareness
- Integration with different model providers (OpenAI, Anthropic, Ollama, etc.)

## Architecture

The system consists of three main components:

1. **Agent Manager**: Handles registration, discovery, and execution of AI agents
2. **Task Queue System**: Manages asynchronous task execution with priorities and dependencies
3. **MCP Server**: Exposes tools and resources for other systems to interact with the orchestration layer

### Agent Types

The orchestration layer supports these agent types:

- **Brand Context**: Manages brand identity, context persistence, and validation
- **Content Generation**: Handles AI-driven content creation with brand-specific voice and style
- **Analytics**: Gathers and analyzes performance data across brands
- **Asset Management**: Manages brand-specific media, templates, and files
- **Workflow Orchestration**: Coordinates complex, multi-step processes

## MCP Tools

The MCP server exposes the following tools:

| Tool Name | Description |
|-----------|-------------|
| `execute_agent` | Execute a specific agent with a prompt |
| `add_task_to_queue` | Add a task to the orchestration queue |
| `get_task_status` | Get the status of a task in the queue |
| `get_task_result` | Get the result of a completed task |
| `register_agent` | Register a new agent with the orchestration layer |
| `get_agent_stats` | Get statistics about registered agents |
| `orchestrate_workflow` | Orchestrate a multi-step workflow using multiple agents |

## MCP Resources

The MCP server provides these resources:

| Resource Name | Description |
|--------------|-------------|
| `agents` | List of all registered agents and their capabilities |
| `queue_stats` | Statistics about the task queue |

## Getting Started

### Prerequisites

- Node.js 18+
- Redis (for task queue)
- MCP runtime

### Installation

1. Install dependencies:

```bash
cd mcp-servers/agent-orchestration
npm install
```

2. Configure environment variables (create a `.env` file):

```
PORT=3020
REDIS_URL=redis://localhost:6379
REGISTER_DEFAULT_AGENTS=true
LOG_LEVEL=info
```

3. Build and start the server:

```bash
npm run build
npm start
```

### Using the MCP Server

The AI Agent Orchestration Layer can be used through the MCP protocol. Here's an example of how to execute an agent:

```typescript
const result = await mcpClient.useTool('agent-orchestration', 'execute_agent', {
  agentType: 'content_generation',
  prompt: 'Generate a blog post about AI orchestration',
  brandContext: 'SaithavyS',
  temperature: 0.7
});

console.log(result.output);
```

## Integration with Other MCP Servers

The AI Agent Orchestration Layer is designed to work with other MCP servers in the multi-brand system:

- **Brand Context MCP**: Provides brand identity and context
- **Content Generation MCP**: Handles specific content creation tasks
- **Analytics MCP**: Provides performance data and insights
- **Asset Management MCP**: Manages media and templates
- **Workflow MCP**: Defines specific workflow templates

## Development

### Project Structure

```
agent-orchestration/
├── src/
│   ├── agents/         # Agent management
│   ├── queue/          # Task queue system
│   ├── mcp/            # MCP server definition
│   ├── utils/          # Utilities
│   └── index.ts        # Entry point
├── package.json
└── tsconfig.json
```

### Running in Development Mode

```bash
npm run dev
```

This will start the server in watch mode, automatically restarting when files change.

## Production Deployment

For production deployment, use the following steps:

1. Build the project:

```bash
npm run build
```

2. Start the server:

```bash
npm start
```

It's recommended to use a process manager like PM2 for production deployment:

```bash
npm install -g pm2
pm2 start dist/index.js --name agent-orchestration
