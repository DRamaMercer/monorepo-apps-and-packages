## TypeScript Configuration in Turborepo Monorepos
**Pattern: Consistent `tsconfig.json` for Monorepos**
- Use TypeScript Project References (`references` array) to manage dependencies between packages and applications in a monorepo.
- Ensure `composite: true` is set in `tsconfig.json` for all referenced projects.
- Utilize `path` aliases in a base `tsconfig.json` (e.g., `config/tsconfig.base.json`) to simplify imports across the monorepo.

## PNPM and Monorepo Dependency Management
**Pattern: Troubleshooting `pnpm` and `pnpm-workspace.yaml`**
- For monorepos, explicitly define workspaces in `pnpm-workspace.yaml` at the root to ensure `pnpm` correctly links internal packages.
- If `npm install` or `yarn install` fail in a monorepo, consider switching to `pnpm install` as it handles symlinking internal packages more robustly.
- After making changes to `pnpm-workspace.yaml` or `package.json` dependencies, clear Turborepo cache (`npx turbo prune` or `npx turbo clean`) and reinstall dependencies to resolve build issues.

## Migrating to a New Service Architecture
**Pattern: Adopting Class-Based Service Patterns (e.g., `MCPService`)**
- When refactoring to a new class-based service architecture, ensure all existing modules are updated to extend the new base class.
- Pay close attention to constructor signatures, import paths, and the registration of tools/resources to align with the new pattern.

## Project-Specific Dependency Usage
**Pattern: `workspace:*` for Internal Monorepo Packages**
- Always use `workspace:*` (e.g., `"@scope/package-name": "workspace:*"`) in `package.json` dependencies for internal packages within a monorepo. This ensures `pnpm` (and Turborepo) correctly links the local packages instead of trying to fetch them from a registry.
