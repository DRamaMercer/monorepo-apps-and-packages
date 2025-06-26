# System Architecture: Multi-Brand AI Studio (MCP Integration)

## Overview

This updated architecture leverages a **Model-Context Protocol (MCP)** powered design to manage multiple brands (SaithavyS, Partly Office, G Prismo) under one AI-driven content studio. The system is organized into layered components that ensure each brand’s operations remain distinct yet coordinated. Key enhancements include a **Brand Context** management layer, specialized **MCP AI servers**, and dynamic context-switching logic, all under robust security and data isolation. This blueprint replaces the legacy monorepo-centric model with an AI orchestration-centric approach, integrating autonomous agents and multi-brand workflows throughout the stack.

---

## 1. Architecture Layers (MCP-Integrated)

1. **Brand Context Layer** – Manages brand identification, context persistence, and isolation across the suite. Components like a _Brand Detection Engine_ and _Context Switcher_ intercept user input or actions to determine the active brand and enforce that context throughout a session. This layer ensures no cross-talk between brands and handles on-the-fly switching of brand focus.
    
2. **MCP Server Layer** – A collection of five specialized AI **MCP microservices** (Brand Context MCP, Content Generation MCP, Analytics MCP, Asset Management MCP, Workflow Orchestration MCP) integrated via Cline 3.0. These Node.js services handle the heavy AI tasks with brand awareness – from content creation to analytics – and coordinate via a central MCP runtime. They provide secure connections to AI models and tools, performing brand-specific processing while maintaining portfolio-wide coordination.
    
3. **Knowledge Base Layer** – A centralized multi-brand knowledge repository (e.g. Obsidian vaults or Notion spaces) containing each brand’s SOPs, guidelines, and historical content. Shared and cross-brand learnings are stored here. AI agents reference this layer for brand guidelines and past data, enabling cross-brand learning while respecting each brand’s unique voice and rules.
    
4. **AI Processing Layer** – A network of AI agents and models specialized per brand. A _Multi-Model Router_ directs requests to the appropriate model (e.g. GPT-4, Claude 2, or local LLMs via Ollama) based on brand and task. Each brand may use a tailored model or prompt style (e.g. SaithavyS using a creative model vs. G Prismo a technical model). This layer ensures content is generated in the correct **brand voice** and style, and it handles on-the-fly adjustments for tone or audience targeting. It works closely with the MCP Content Generation server.
    
5. **File & Asset Layer** – Brand-segmented storage for assets and outputs. Each brand has isolated file storage (structured folders in Google Drive or Supabase Storage) for content templates, images, and generated outputs. Shared templates and cross-brand resources reside in common libraries but are applied through context (e.g. a common blog template that the system adapts per brand). Automated file organizers (part of the Asset Management MCP) keep assets sorted by brand and type, and ensure no accidental leakage of assets between brands.
    
6. **Automation Engine Layer** – Workflow automation tools enhanced for multi-brand context. This includes an n8n (or similar) automation server and possible Zapier integrations, all configured to be **brand-aware**. Workflows can trigger on schedules or events (like new leads or content approvals) with brand-specific logic. The Workflow Orchestration MCP coordinates these triggers and sequences, ensuring that multi-step processes (e.g. generating, reviewing, and publishing a blog post) run with the correct brand parameters at each step. Cross-brand triggers (like reusing a successful campaign idea across brands) are handled in a controlled manner.
    
7. **Data & Analytics Layer** – A **brand-segmented database** (Supabase Postgres) and unified analytics dashboards (e.g. Looker Studio or Metabase) for portfolio insights. Data for all brands is stored in common tables but partitioned by brand (using foreign keys and Row-Level Security). Real-time metrics are collected via the Analytics MCP Server: performance data (content engagement, workflow execution times, success rates) flows into a `performance_metrics` table keyed per brand. Each brand can be analyzed on its own, while an aggregate “portfolio” view allows cross-brand comparison and discovery of synergies.
    
8. **Interface Layer** – A multi-brand **Next.js dashboard** serving as the central admin and studio UI. Administrators and content creators can switch between brand contexts via a brand selector in the UI, which triggers the underlying context switch logic. Each brand has its own section (or sub-site) within this dashboard for managing content, analytics, and settings specific to that brand. This layer also encompasses any public-facing brand sites or pages, which retrieve content via the centralized system APIs or generate static sites per brand. The Brand Hub architecture ensures the front-end respects the active brand’s theme, styling, and permissions at all times.
    
9. **Security & Compliance** – A unified security model with **brand-level isolation and portfolio-wide governance**. Supabase **Row-Level Security (RLS)** policies enforce that users and automation processes only access data for their allowed brand(s). API endpoints and MCP interactions require authentication tokens and carry the brand context to authorize actions. The system centralizes audit logs (for content changes, AI agent decisions, workflow executions) to a monitoring service. Compliance rules (such as GDPR data handling or brand-specific legal requirements) are applied at the brand level but managed centrally to ensure consistency. In effect, each brand’s data and AI activities are sandboxed, while the organization’s administrators maintain oversight across all brand operations.
    

---

## 2. MCP Servers and AI Agent Ecosystem

**MCP Core Runtime:** At the heart of the AI orchestration is the Cline 3.0 core engine and MCP runtime, which manage communications between the specialized servers. The MCP runtime acts as a broker, invoking the appropriate specialized server based on the task and current brand context. It ensures each request carries brand metadata so that downstream processing is brand-aware.

**Specialized MCP Servers:** The system deploys five primary MCP servers, each with a distinct role:

- **Brand Context MCP Server** – The first touch for any request. It detects the intended brand from input (user selection or content cues), establishes a context lock (so subsequent steps know the brand), and validates that content or actions align with that brand’s guidelines. This server also handles _context switching_: when an admin changes the active brand in the UI, it ensures a clean transition by loading the new brand’s settings and clearing or updating any in-memory context.
    
- **Content Generation MCP Server** – Handles all AI content creation tasks. It receives a content request (blog idea, social caption, analysis report, etc.), then selects the appropriate language model or prompt template for the brand. It enforces **voice consistency** (e.g. ensuring a Partly Office post sounds “professional and solution-oriented”) and style guidelines as it generates text. This server also implements _fallbacks_ (switching to an alternate model or re-try strategy if the primary model fails) and logs content results to the database via the Data layer.
    
- **Analytics MCP Server** – Continuously gathers and analyzes performance data. It pulls data from Supabase (and potentially external sources like Google Analytics or social media insights) segmented by brand. Using this data, it can generate **portfolio-wide insights** – for example, identifying that “G Prismo’s engagement is rising due to technical articles, which could be applied to Partly Office’s strategy”. It provides predictive analytics (trends, forecasts) and passes recommendations to other agents or to the dashboard. It essentially turns raw metrics into actionable intelligence per brand and for the whole portfolio.
    
- **Asset Management MCP Server** – Manages files, media, and templates. It ensures that when content is generated or uploaded, it goes to the correct brand folder and naming convention. It can automatically apply brand logos or visual elements to content if needed, and retrieve brand-specific templates (like an email newsletter layout for SaithavyS vs. one for G Prismo). This server synchronizes with Google Drive or Supabase Storage and can also propose cross-brand template re-use when appropriate (with approval).
    
- **Workflow Orchestration MCP Server** – Coordinates complex workflows that involve multiple steps or multiple servers. For example, a “publish blog” workflow might involve the Content Gen server (to write the draft), then the Asset server (to upload images), then maybe a human approval step via the dashboard, and finally an Automation action to post on a CMS. The Workflow MCP triggers each step in order, handling branching logic for different brands (maybe Partly Office requires an extra compliance review step that SaithavyS doesn’t). It integrates with external automation tools like n8n or Zapier to listen for triggers (scheduled times, incoming emails, etc.) and invokes the appropriate internal tasks. This server is crucial for ensuring that each brand’s processes run smoothly end-to-end, and that any cross-brand workflows (like comparing metrics or cloning content from one brand to another) are executed under strict rules.
    

These MCP servers form a hierarchy of **AI agents**, each specialized but working together. The Brand Context server feeds context into Content Generation; the Workflow server calls others in sequence; the Analytics server informs content strategy, and so on. The **AI agent hierarchy** is thus both vertical (within each MCP server, there may be multiple sub-agents or model endpoints) and horizontal (the servers collaborate as peers through the MCP runtime). This design allows the system to scale AI capabilities modularly—new specialized agents (for example, a “Translation MCP Server” or a “Compliance MCP Server”) could be added without disrupting existing ones, by simply plugging into the MCP integration layer.

---

## 3. Multi-Brand Data Flows

The introduction of brand context and MCP orchestration changes how data and commands flow through the system. Below are the primary patterns:

**a. Brand-Aware Content Creation Flow:** A user or scheduler initiates a content task (e.g. “generate blog post”). The **Brand Context MCP** first determines the brand (either explicitly chosen or inferred from the request data) and locks the context. It validates the request against that brand’s rules (for example, ensuring the topic fits the brand’s target audience and any regulatory constraints). The task then flows to the **Content Generation MCP**, which selects a suitable model and produces the content in the brand’s style. Once generated, the output may go through a _voice/style validation_ step (either within the content server or back through the brand context server) to double-check compliance with brand guidelines. The **Asset Management MCP** then stores the content in the appropriate brand repository and prepares any media assets. Finally, the **Analytics MCP** records performance data from this operation (time taken, model used, etc.) and will later track how this content performs with the audience. Throughout this flow, the brand context remains attached, ensuring that every decision (which model to use, where to save content) is made with the brand in mind.

**b. Cross-Brand Optimization Flow:** At a portfolio level, the **Analytics MCP** aggregates metrics and identifies trends or opportunities that span multiple brands. For example, it might detect that Partly Office’s how-to articles are performing exceptionally well. The Analytics server’s **Insight Generator** module formulates a recommendation – perhaps suggesting SaithavyS also publish a how-to series. This insight triggers a _cross-brand strategy workflow_: it goes through a **Context Validation** (to ensure the suggestion aligns with SaithavyS’s brand voice and goals) via the Brand Context server, then the **Workflow Orchestration MCP** coordinates implementation. This could spawn new content tasks in SaithavyS’s context (handled by Content Gen), or schedule a planning meeting for brand managers. The impact of these changes (e.g. improved metrics) will be measured by Analytics MCP in an ongoing feedback loop. This flow demonstrates how the system not only manages brands individually, but also intelligently **cross-pollinates successful strategies** while respecting each brand’s uniqueness.

**c. Brand Context Switching Flow:** When an administrator uses the interface to switch the active brand (say, from the SaithavyS dashboard to Partly Office), the system ensures a clean transition. The **Brand Switch Request** from the UI is sent to the **Brand Context MCP**, which validates that the user has access to the target brand and then loads that brand’s context (brand guidelines, configuration, theme) into the session. The AI Processing layer reconfigures any in-memory agents or prompts to the new brand’s settings (for instance, the content suggestions module will now use Partly Office’s tone and not reference SaithavyS content). The UI updates to reflect the new brand (logo, colors, navigation items) – this is enabled by the **Interface Layer** subscribing to context changes. The Workflow Orchestration server also updates its routing: any ongoing automated jobs for the previous brand are paused or handed over, and new triggers for the now-active brand are engaged. Thanks to this flow, a single user can seamlessly administer multiple brands in one session without confusion or data bleed. All underlying data queries and AI operations automatically pivot to the correct brand’s scope as soon as the switch occurs.

---

## 4. Updated Security Model

Security is foundational in this multi-brand AI architecture. **Row-Level Security (RLS)** in the database ensures that content, workflows, and analytics for one brand cannot be accessed or modified by users of another brand (unless explicitly given cross-brand privileges). Each API call or internal service call includes a brand context token or ID, which is verified at every layer:

- The **MCP servers** perform context checks on their inputs. For example, the Content Gen server will refuse to generate content if the brand context is missing or if the request tries to mix data from multiple brands.
    
- The **Supabase Edge Functions** and any custom APIs enforce that the requesting user/session’s JWT contains the proper `brand_id` claims when accessing data. Combined with RLS, this double-checks permissions both in application logic and the DB layer.
    
- Secrets and keys (for third-party integrations like OpenAI, Google, Stripe) are partitioned per brand where applicable. This prevents a breach in one brand’s API key (say an OpenAI key for G Prismo’s long-form content agent) from affecting other brands.
    
- A **central governance module** monitors compliance, especially where AI is involved. It logs all AI-generated content along with the model and parameters used, providing an audit trail. If a brand has specific compliance needs (e.g. Partly Office might require that any AI-generated copy is reviewed by a human if it’s going public), the workflow engine enforces those rules.
    

Overall, the updated architecture is built to **scale securely**. AI-driven multi-brand operations introduce new vectors (like potential model bias per brand or data mixing), but these are mitigated by strict context isolation and validation at each step. The system can confidently automate operations across SaithavyS, Partly Office, and G Prismo knowing that each brand’s data, style, and rules are respected and protected.

---

## 5. Data Scalability and Extensibility

The MCP-powered multi-brand design greatly simplifies adding new brands and extending features:

- **Adding a New Brand:** Onboarding a new brand no longer requires duplicating an entire site codebase. Instead, one would create a new entry in the `brand_hubs` table (with the brand’s name, slug, and basic info), add brand-specific configurations (e.g. a new folder under `prompts/` for its AI prompt variations, and entries in `brand-contexts.json` for its voice and model preferences), and include any brand-specific assets or guidelines. The system’s layers – from context detection to RLS policies – automatically accommodate the new brand. The admin UI will list it, and all automation and AI agents will treat it as another isolated context. This drastically reduces onboarding time for brand expansion.
    
- **Extending AI Capabilities:** Thanks to the modular MCP server layer, introducing a new AI function is straightforward. For instance, if we want an AI **Translation agent** for multi-language support, we could spin up a new MCP server (e.g. `translation-mcp`) and integrate it with the Workflow Orchestrator (for when content needs translating) and the Interface (to offer translation options per brand). Similarly, if one brand needs a specific AI model (say a financial model for a finance-focused brand), it can be added to that brand’s model routing in the Content Gen server without affecting others.
    
- **Feature Enhancements:** Traditional web stack features (analytics, e-commerce, etc.) remain plug-and-play via the monorepo/packages approach, but now they can also leverage the AI layer. For example, adding an **e-commerce** feature for a brand could involve enabling Stripe for that brand and also possibly using the Content AI to generate product descriptions. The architecture’s layered nature means these additions remain organized: e-commerce logic in its module, with hooks to AI as needed.
    

In summary, the re-architected system is **highly extensible and scalable**. It maintains clear separations of concern (via layers and services) while allowing the **autonomous AI agents** to interconnect everything. This ensures that as the multi-brand suite grows – whether in number of brands, volume of content, or breadth of features – it can do so without a complete redesign, and importantly, **without sacrificing the individual identity or security of each brand**.

---

## 6. Deployment & Operations Considerations

The multi-brand AI studio is deployed as a collection of services:

- **MCP Servers:** Each MCP AI server runs as its own service (Node.js process or container). In development, they run locally (e.g. via `npm` scripts or a process manager) to allow the autonomous agents to collaborate. In production, these could be deployed as serverless functions or Docker containers (for example, on a Kubernetes cluster), enabling independent scaling. If content generation load spikes, one can scale out the Content Gen MCP without affecting others.
    
- **Web Dashboard:** The Next.js multi-brand dashboard can be deployed on platforms like Vercel or Netlify. It communicates with the MCP layer via API routes or direct RPC calls (secured by tokens). Static site generation or incremental static regeneration could be used for any public-facing brand pages to handle traffic efficiently.
    
- **Database:** Supabase (Postgres) backs the data layer, and its managed hosting ensures automatic scaling and a robust API layer (via Supabase Functions and real-time subscriptions). Each brand’s data resides in the same logical database but is safeguarded by RLS and schema design.
    
- **Automation Engine:** The n8n workflow automation can be hosted on a small VM or container, or even within a Docker Compose with the MCP servers. It connects via webhooks or API calls to trigger internal workflows. For reliability, critical workflows might be encoded as Supabase scheduled functions as well, serving as a backup to external tools.
    

**Monitoring & Logging:** Each component emits logs and metrics. MCP servers log AI requests, decisions, and errors to a centralized logging service (e.g. supabase logs or an ELK stack). The **performance_metrics** table collects key figures (like how long an AI task took, success/failure counts, etc.) which are visualized in the admin dashboard analytics. Alerts can be set up (for example, if a particular brand’s workflow fails repeatedly or if content generation latency exceeds a threshold). This ensures that the autonomous system remains under human oversight and any issues can be quickly addressed.

By integrating modern DevOps practices with the MCP architecture, the operations of the platform remain manageable. Continuous deployment pipelines (GitHub Actions) can test and deploy changes to each microservice and the front-end in tandem. The entire system adheres to a **zero-cost licensing principle** – all key components (Supabase, n8n, Next.js, etc.) are open-source or have free tiers – which keeps operational costs minimal. This aligns with the project’s goal of an affordable yet powerful AI-driven multi-brand management suite.