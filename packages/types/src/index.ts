/**
 * Core types for the Multi-Brand AI Agent System
 */

// Brand types
export type BrandId = 'saithavys' | 'partly-office' | 'g-prismo' | 'default'

export interface Brand {
  id: BrandId
  name: string
  description: string
  status: BrandStatus
}

export type BrandStatus = 'active' | 'inactive' | 'pending'

// MCP Server types
export type McpServerId = 
  | 'brand-context' 
  | 'content-generation' 
  | 'analytics' 
  | 'asset-management'
  | 'workflow-orchestration'

export interface McpServer {
  id: McpServerId
  name: string
  status: McpServerStatus
  port: number
  version?: string
}

export type McpServerStatus = 'active' | 'inactive' | 'pending' | 'error'

// Content types
export interface ContentItem {
  id: string
  brandId: BrandId
  title: string
  description?: string
  type: ContentType
  status: ContentStatus
  createdAt: string
  updatedAt: string
  publishedAt?: string
  metadata?: Record<string, unknown>
}

export type ContentType = 
  | 'blog-post' 
  | 'social-media' 
  | 'email' 
  | 'documentation'
  | 'product-description'
  | 'press-release'

export type ContentStatus = 'draft' | 'review' | 'published' | 'archived'

// API response types
export interface ApiResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
  timestamp: string
}

// User types
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  permissions: UserPermission[]
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'editor' | 'viewer'

export type UserPermission = 
  | 'manage_brands'
  | 'create_content'
  | 'edit_content'
  | 'publish_content'
  | 'manage_users'
  | 'view_analytics'
  | 'manage_mcp_servers'
