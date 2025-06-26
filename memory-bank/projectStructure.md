# Updated Multi-Brand AI Agent Project Structure

## Key Changes for Multi-Brand Architecture

### 1. Enhanced cline_docs Structure

```
cline_docs/
├── .cline-rules                     # Cline-specific rules for docs
├── productContext.md                # Project goals, purpose & vision
├── systemPatterns.md                # Architecture patterns & conventions
├── techContext.md                   # Tech stack, dependencies & constraints
├── progress.md                      # Current status, todos & milestones
├── brands/                          # **NEW: Brand-specific documentation**
│   ├── brand-architecture.md        # Multi-brand system design
│   ├── brand-guidelines.md          # Brand voice & style guides
│   ├── saithavys/                   # SaithavyS brand documentation
│   │   ├── content-strategy.md      # Content approach & voice
│   │   ├── ai-training-data.md      # Brand-specific training materials
│   │   └── performance-targets.md   # Brand-specific KPIs
│   ├── partly-office/               # Partly Office brand documentation
│   │   ├── content-strategy.md      # Business-focused content approach
│   │   ├── ai-training-data.md      # Professional tone training
│   │   └── performance-targets.md   # B2B-focused metrics
│   └── g-prismo/                    # G Prismo brand documentation
│       ├── content-strategy.md      # Tech-focused content approach
│       ├── ai-training-data.md      # Technical content training
│       └── performance-targets.md   # Innovation-focused KPIs
├── implementation/
│   ├── supabase-setup.md            # Updated with multi-brand schema
│   ├── supabase-schema.md           # Enhanced with brand tables
│   ├── brand-hub-setup.md           # **NEW: Brand hub configuration**
│   ├── api-key-security.md          # API key management & security
│   ├── chatgpt-api-integration.md   # Updated with brand context
│   ├── google-drive-integration.md  # Enhanced folder structure
│   ├── make-workflow-creation.md    # Brand-aware workflows
│   └── performance-monitoring.md    # Brand-segmented metrics
├── architecture/
│   ├── data-layer-components.md     # Updated with brand relationships
│   ├── processing-layer.md          # Brand-aware processing
│   ├── application-layer.md         # Multi-brand dashboard design
│   ├── ai-agent-specializations.md # Brand-specific agent roles
│   ├── dashboard-design.md          # Brand hub UI/UX
│   └── brand-switching-logic.md     # **NEW: Brand context switching**
└── metrics/
    ├── performance-metrics-table.md # Brand-segmented KPIs
    ├── dashboard-kpis.md            # Multi-brand metrics
    └── brand-comparison-reports.md  # **NEW: Cross-brand analytics**
```

### 2. Enhanced Dashboard Structure

```
dashboard/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx              # Updated with brand selector
│   │   ├── page.tsx                # Multi-brand overview
│   │   │
│   │   ├── brands/                 # **NEW: Brand management section**
│   │   │   ├── page.tsx            # Brand hub overview
│   │   │   ├── switch/
│   │   │   │   └── [brand]/
│   │   │   │       └── page.tsx    # Brand context switcher
│   │   │   ├── saithavys/
│   │   │   │   ├── page.tsx        # SaithavyS brand dashboard
│   │   │   │   ├── content/
│   │   │   │   │   └── page.tsx    # Brand-specific content
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx    # Brand performance
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx    # Brand configuration
│   │   │   ├── partly-office/
│   │   │   │   ├── page.tsx        # Partly Office dashboard
│   │   │   │   ├── content/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   └── g-prismo/
│   │   │       ├── page.tsx        # G Prismo dashboard
│   │   │       ├── content/
│   │   │       ├── analytics/
│   │   │       └── settings/
│   │   │
│   │   ├── workflows/              # Enhanced with brand context
│   │   │   ├── page.tsx            # Brand-filtered workflows
│   │   │   ├── create/
│   │   │   │   └── page.tsx        # Brand-aware workflow creation
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Brand-specific workflow details
│   │   │       └── brand-config/
│   │   │           └── page.tsx    # **NEW: Brand-specific settings**
│   │   │
│   │   ├── content/                # Enhanced with brand segmentation
│   │   │   ├── page.tsx            # Brand-filtered content overview
│   │   │   ├── create/
│   │   │   │   └── page.tsx        # Brand-aware content creation
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Content with brand context
│   │   │   └── cross-brand/
│   │   │       └── page.tsx        # **NEW: Cross-brand content analysis**
│   │   │
│   │   ├── agents/                 # Enhanced with brand specialization
│   │   │   ├── page.tsx            # Brand-aware agent overview
│   │   │   ├── create/
│   │   │   │   └── page.tsx        # Brand-specific agent creation
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx        # Agent with brand context
│   │   │   │   └── brand-training/
│   │   │   │       └── page.tsx    # **NEW: Brand-specific training**
│   │   │   └── brand-assignments/
│   │   │       └── page.tsx        # **NEW: Agent-brand assignments**
│   │   │
│   │   └── analytics/              # Enhanced with brand comparison
│   │       ├── page.tsx            # Multi-brand analytics dashboard
│   │       ├── brand-comparison/
│   │       │   └── page.tsx        # **NEW: Cross-brand analysis**
│   │       ├── saithavys/
│   │       │   └── page.tsx        # SaithavyS analytics
│   │       ├── partly-office/
│   │       │   └── page.tsx        # Partly Office analytics
│   │       └── g-prismo/
│   │           └── page.tsx        # G Prismo analytics
│   │
│   └── api/                        # Enhanced with brand context
│       ├── brands/                 # **NEW: Brand management API**
│       │   ├── route.ts            # GET/POST brands
│       │   ├── [id]/
│       │   │   └── route.ts        # Brand CRUD operations
│       │   ├── switch/
│       │   │   └── route.ts        # Brand context switching
│       │   └── guidelines/
│       │       └── route.ts        # Brand guidelines API
│       ├── workflows/              # Enhanced with brand filtering
│       │   ├── route.ts            # Brand-aware workflow listing
│       │   └── [id]/
│       │       ├── route.ts        # Workflow with brand context
│       │       └── brand-config/
│       │           └── route.ts    # Brand-specific workflow config
│       ├── content/                # Enhanced with brand segmentation
│       │   ├── route.ts            # Brand-filtered content
│       │   ├── [id]/
│       │   │   └── route.ts        # Content with brand metadata
│       │   └── generate/
│       │       └── route.ts        # Brand-aware content generation
│       └── agents/                 # Enhanced with brand specialization
│           ├── route.ts            # Brand-specific agent listing
│           ├── [id]/
│           │   ├── route.ts        # Agent with brand context
│           │   └── chat/
│           │       └── route.ts    # Brand-aware chat endpoint
│           └── brand-training/
│               └── route.ts        # **NEW: Brand-specific training API**
├── components/
│   ├── features/
│   │   ├── brands/                 # **NEW: Brand management components**
│   │   │   ├── BrandSelector.tsx   # Brand switching component
│   │   │   ├── BrandDashboard.tsx  # Individual brand dashboard
│   │   │   ├── BrandSettings.tsx   # Brand configuration
│   │   │   ├── BrandGuidelines.tsx # Brand guidelines editor
│   │   │   ├── BrandComparison.tsx # Cross-brand comparison
│   │   │   └── BrandAssets.tsx     # Brand asset management
│   │   ├── workflow/               # Enhanced with brand context
│   │   │   ├── WorkflowList.tsx    # Brand-filtered workflows
│   │   │   ├── BrandWorkflowCard.tsx # **NEW: Brand-aware workflow card**
│   │   │   └── BrandWorkflowBuilder.tsx # Brand-specific workflow builder
│   │   ├── content/                # Enhanced with brand segmentation
│   │   │   ├── BrandContentEditor.tsx # Brand-aware content editor
│   │   │   ├── BrandContentLibrary.tsx # Brand-specific content library
│   │   │   └── CrossBrandAnalysis.tsx # **NEW: Cross-brand content analysis**
│   │   ├── agents/                 # Enhanced with brand specialization
│   │   │   ├── BrandAgentList.tsx  # Brand-specific agent listing
│   │   │   ├── BrandAgentBuilder.tsx # Brand-aware agent configuration
│   │   │   ├── BrandAgentTraining.tsx # Brand-specific training UI
│   │   │   └── AgentBrandAssignment.tsx # **NEW: Agent-brand assignments**
│   │   └── analytics/              # Enhanced with brand comparison
│   │       ├── MultiBrandDashboard.tsx # Multi-brand overview
│   │       ├── BrandMetricsCard.tsx # Individual brand metrics
│   │       ├── BrandComparisonChart.tsx # Cross-brand comparison
│   │       └── BrandPerformanceReport.tsx # Brand-specific reports
│   └── layout/
│       ├── Header.tsx              # Updated with brand selector
│       ├── BrandSidebar.tsx        # **NEW: Brand-aware navigation**
│       └── BrandBreadcrumbs.tsx    # **NEW: Brand context breadcrumbs**
├── lib/
│   ├── brand-context.ts            # **NEW: Brand context management**
│   ├── brand-switching.ts          # **NEW: Brand switching utilities**
│   └── brand-guidelines.ts         # **NEW: Brand guidelines utilities**
└── types/
    ├── brand.ts                    # **NEW: Brand-related types**
    ├── workflow.ts                 # Enhanced with brand context
    ├── content.ts                  # Enhanced with brand metadata
    └── agent.ts                    # Enhanced with brand specialization
```

### 3. Enhanced Google Drive Structure

```
Google Drive Integration:
/AI-System/
├── Core/                           # Shared system files
├── Brand-Configs/                  # **NEW: Brand configuration files**
│   ├── saithavys-config.json       # SaithavyS brand settings
│   ├── partly-office-config.json   # Partly Office brand settings
│   └── g-prismo-config.json        # G Prismo brand settings
└── Shared-Templates/               # Cross-brand templates

/Templates/
├── Universal/                      # Cross-brand templates
├── SaithavyS/                     # **NEW: Brand-specific templates**
│   ├── blog-templates/
│   ├── social-templates/
│   └── email-templates/
├── Partly-Office/                 # **NEW: Business-focused templates**
│   ├── business-content/
│   ├── productivity-guides/
│   └── client-communications/
└── G-Prismo/                      # **NEW: Tech-focused templates**
    ├── technical-content/
    ├── innovation-posts/
    └── tech-analysis/

/Generated/
├── SaithavyS/                     # Brand-specific generated content
│   ├── 2024/
│   └── 2025/
├── Partly-Office/
│   ├── 2024/
│   └── 2025/
└── G-Prismo/
    ├── 2024/
    └── 2025/

/Training-Data/
├── Universal/                      # Cross-brand training data
├── SaithavyS/                     # **NEW: Personal brand training**
│   ├── voice-samples/
│   ├── content-examples/
│   └── audience-insights/
├── Partly-Office/                 # **NEW: Business training data**
│   ├── business-writing-samples/
│   ├── industry-terminology/
│   └── professional-tone-examples/
└── G-Prismo/                      # **NEW: Tech training data**
    ├── technical-writing-samples/
    ├── innovation-content/
    └── tech-terminology/

/Brand-Assets/                     # **NEW: Brand-specific assets**
├── SaithavyS/
│   ├── logos/
│   ├── colors/
│   ├── fonts/
│   └── style-guide.pdf
├── Partly-Office/
│   ├── logos/
│   ├── brand-guidelines/
│   └── marketing-materials/
└── G-Prismo/
    ├── logos/
    ├── tech-visuals/
    └── brand-standards/
```

### 4. Enhanced N8N Workflows

```
n8n-workflows/
├── workflows/
│   ├── brand-aware/                # **NEW: Brand-specific workflows**
│   │   ├── saithavys-content-gen.json
│   │   ├── partly-office-business-content.json
│   │   ├── g-prismo-tech-content.json
│   │   └── cross-brand-analytics.json
│   ├── content-generation.json     # Enhanced with brand context
│   ├── brand-switching.json        # **NEW: Brand context switching**
│   └── multi-brand-reporting.json  # **NEW: Cross-brand reporting**
└── templates/
    ├── brand-content-pipeline.json # **NEW: Brand-specific content pipeline**
    └── multi-brand-workflow.json   # **NEW: Multi-brand workflow template**
```

### 5. Enhanced Configuration Structure

```
config/
├── brands/                         # **NEW: Brand-specific configurations**
│   ├── saithavys.json             # SaithavyS brand config
│   ├── partly-office.json         # Partly Office brand config
│   └── g-prismo.json              # G Prismo brand config
├── database/
│   ├── schema.sql                 # Updated with brand tables
│   ├── migrations/
│   │   ├── 001_create_brands.sql  # **NEW: Brand tables migration**
│   │   └── 002_add_brand_relationships.sql
│   └── seeds/
│       ├── brands.sql             # **NEW: Brand seed data**
│       └── brand-guidelines.sql    # **NEW: Brand guidelines seed**
└── environments/
    ├── development.json           # Updated with brand configs
    ├── staging.json               # Multi-brand staging setup
    └── production.json            # Multi-brand production setup
```

## Key Integration Points for Multi-Brand Architecture

### 1. Brand Context Management
- **Global brand state** in React context
- **URL-based brand switching** (`/dashboard/brands/saithavys`)
- **API request brand headers** for filtering
- **Database queries with brand filtering**

### 2. AI Agent Brand Specialization
- **Brand-specific training data** for each agent
- **Brand voice and tone adaptation**
- **Brand-aware content generation**
- **Cross-brand knowledge sharing**

### 3. Performance Tracking
- **Brand-segmented analytics**
- **Cross-brand comparison reports**
- **Brand-specific KPIs and goals**
- **Unified dashboard with brand filters**

### 4. Content Management
- **Brand-specific content libraries**
- **Cross-brand content repurposing**
- **Brand guideline enforcement**
- **Multi-brand publishing workflows**

### 5. Security & Permissions
- **Brand-level access controls**
- **Brand-specific API keys if needed**
- **Cross-brand data isolation**
- **Brand administrator roles**

This enhanced structure maintains the original architecture while adding the necessary brand-specific layers for managing SaithavyS, Partly Office, and G Prismo as distinct brand hubs within your AI agent system.