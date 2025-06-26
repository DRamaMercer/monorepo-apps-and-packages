# Multi-Brand AI Agent System

A Cline-powered multi-brand AI agent system built on a monorepo architecture. This project supports multiple brands with brand-specific contexts, content generation, and UI theming.

## Project Structure

This project is organized as a Turborepo monorepo with the following components:

### Apps

- **web**: Next.js 14 application with App Router for the multi-brand dashboard UI
- **api**: Hono.js API server for backend services

### Packages

- **core**: Shared utilities, constants, and logging functionality
- **ui**: Reusable UI components with brand-aware theming
- **types**: Shared TypeScript types for the system

### MCP Servers

- **brand-context**: MCP server for brand context management, detection, and validation
- **content-generation**: MCP server for AI-driven content generation (planned)
- **analytics**: MCP server for gathering and analyzing performance data (planned)
- **asset-management**: MCP server for managing brand-specific media and files (planned)
- **workflow-orchestration**: MCP server for coordinating multi-step processes (planned)

### Brands

The system supports the following brands:

- **SaithavyS**: Personal brand management and content generation
- **Partly Office**: Professional services and business content
- **G Prismo**: Technology and innovation content

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/multi-brand-ai-system.git
   cd multi-brand-ai-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build all packages:
   ```
   npm run build
   ```

### Development

To run the development servers:

```
npm run dev
```

This will start the Next.js app, Hono.js API server, and MCP servers in development mode.

To run a specific app or package:

```
npm run dev --filter=@monorepo/web
npm run dev --filter=@monorepo/api
```

### Building

To build all apps and packages:

```
npm run build
```

To build a specific app or package:

```
npm run build --filter=@monorepo/web
npm run build --filter=@monorepo/api
```

## Architecture

This system implements a specialized multi-brand AI agent architecture using Model Context Protocol (MCP) servers for different aspects of the system:

- **Brand Context MCP** handles brand detection, context switching, and ensures content stays aligned with brand guidelines
- **Content Generation MCP** (planned) will generate brand-appropriate content using AI models
- **Analytics MCP** (planned) will gather and analyze performance data across brands
- **Asset Management MCP** (planned) will handle brand-specific media and files
- **Workflow Orchestration MCP** (planned) will coordinate multi-step processes across the system

The system maintains strict brand isolation while allowing for cross-brand insights and optimization.

## License

This project is licensed under the ISC License.
