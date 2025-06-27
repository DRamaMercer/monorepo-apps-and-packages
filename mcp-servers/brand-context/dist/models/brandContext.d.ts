import { z } from 'zod';
/**
 * Brand Context Model - defines the schema for brand configuration
 */
export declare const BrandContextSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    voice: z.ZodObject<{
        tone: z.ZodEnum<["formal", "casual", "friendly", "professional", "playful", "serious"]>;
        personality: z.ZodArray<z.ZodString, "many">;
        audience: z.ZodArray<z.ZodString, "many">;
        style: z.ZodArray<z.ZodString, "many">;
        vocabulary: z.ZodOptional<z.ZodObject<{
            preferredTerms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            avoidedTerms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            preferredTerms?: Record<string, string> | undefined;
            avoidedTerms?: Record<string, string> | undefined;
        }, {
            preferredTerms?: Record<string, string> | undefined;
            avoidedTerms?: Record<string, string> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        tone: "formal" | "casual" | "friendly" | "professional" | "playful" | "serious";
        personality: string[];
        audience: string[];
        style: string[];
        vocabulary?: {
            preferredTerms?: Record<string, string> | undefined;
            avoidedTerms?: Record<string, string> | undefined;
        } | undefined;
    }, {
        tone: "formal" | "casual" | "friendly" | "professional" | "playful" | "serious";
        personality: string[];
        audience: string[];
        style: string[];
        vocabulary?: {
            preferredTerms?: Record<string, string> | undefined;
            avoidedTerms?: Record<string, string> | undefined;
        } | undefined;
    }>;
    visual: z.ZodOptional<z.ZodObject<{
        colors: z.ZodObject<{
            primary: z.ZodString;
            secondary: z.ZodOptional<z.ZodString>;
            accent: z.ZodOptional<z.ZodString>;
            text: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            primary: string;
            secondary?: string | undefined;
            accent?: string | undefined;
            text?: string | undefined;
            background?: string | undefined;
        }, {
            primary: string;
            secondary?: string | undefined;
            accent?: string | undefined;
            text?: string | undefined;
            background?: string | undefined;
        }>;
        typography: z.ZodOptional<z.ZodObject<{
            primaryFont: z.ZodString;
            secondaryFont: z.ZodOptional<z.ZodString>;
            headingFont: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            primaryFont: string;
            secondaryFont?: string | undefined;
            headingFont?: string | undefined;
        }, {
            primaryFont: string;
            secondaryFont?: string | undefined;
            headingFont?: string | undefined;
        }>>;
        logo: z.ZodOptional<z.ZodObject<{
            primary: z.ZodString;
            secondary: z.ZodOptional<z.ZodString>;
            favicon: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            primary: string;
            secondary?: string | undefined;
            favicon?: string | undefined;
        }, {
            primary: string;
            secondary?: string | undefined;
            favicon?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        colors: {
            primary: string;
            secondary?: string | undefined;
            accent?: string | undefined;
            text?: string | undefined;
            background?: string | undefined;
        };
        typography?: {
            primaryFont: string;
            secondaryFont?: string | undefined;
            headingFont?: string | undefined;
        } | undefined;
        logo?: {
            primary: string;
            secondary?: string | undefined;
            favicon?: string | undefined;
        } | undefined;
    }, {
        colors: {
            primary: string;
            secondary?: string | undefined;
            accent?: string | undefined;
            text?: string | undefined;
            background?: string | undefined;
        };
        typography?: {
            primaryFont: string;
            secondaryFont?: string | undefined;
            headingFont?: string | undefined;
        } | undefined;
        logo?: {
            primary: string;
            secondary?: string | undefined;
            favicon?: string | undefined;
        } | undefined;
    }>>;
    contentGuidelines: z.ZodOptional<z.ZodObject<{
        maxHeadingLength: z.ZodOptional<z.ZodNumber>;
        paragraphStyle: z.ZodOptional<z.ZodEnum<["short", "medium", "long"]>>;
        preferredFormats: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        contentTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tonalRules: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        maxHeadingLength?: number | undefined;
        paragraphStyle?: "short" | "medium" | "long" | undefined;
        preferredFormats?: string[] | undefined;
        contentTypes?: string[] | undefined;
        tonalRules?: string[] | undefined;
    }, {
        maxHeadingLength?: number | undefined;
        paragraphStyle?: "short" | "medium" | "long" | undefined;
        preferredFormats?: string[] | undefined;
        contentTypes?: string[] | undefined;
        tonalRules?: string[] | undefined;
    }>>;
    metadata: z.ZodObject<{
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        version: z.ZodNumber;
        status: z.ZodEnum<["active", "draft", "archived"]>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "draft" | "archived";
        createdAt: string;
        updatedAt: string;
        version: number;
    }, {
        status: "active" | "draft" | "archived";
        createdAt: string;
        updatedAt: string;
        version: number;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    slug: string;
    name: string;
    voice: {
        tone: "formal" | "casual" | "friendly" | "professional" | "playful" | "serious";
        personality: string[];
        audience: string[];
        style: string[];
        vocabulary?: {
            preferredTerms?: Record<string, string> | undefined;
            avoidedTerms?: Record<string, string> | undefined;
        } | undefined;
    };
    metadata: {
        status: "active" | "draft" | "archived";
        createdAt: string;
        updatedAt: string;
        version: number;
    };
    description?: string | undefined;
    visual?: {
        colors: {
            primary: string;
            secondary?: string | undefined;
            accent?: string | undefined;
            text?: string | undefined;
            background?: string | undefined;
        };
        typography?: {
            primaryFont: string;
            secondaryFont?: string | undefined;
            headingFont?: string | undefined;
        } | undefined;
        logo?: {
            primary: string;
            secondary?: string | undefined;
            favicon?: string | undefined;
        } | undefined;
    } | undefined;
    contentGuidelines?: {
        maxHeadingLength?: number | undefined;
        paragraphStyle?: "short" | "medium" | "long" | undefined;
        preferredFormats?: string[] | undefined;
        contentTypes?: string[] | undefined;
        tonalRules?: string[] | undefined;
    } | undefined;
}, {
    id: string;
    slug: string;
    name: string;
    voice: {
        tone: "formal" | "casual" | "friendly" | "professional" | "playful" | "serious";
        personality: string[];
        audience: string[];
        style: string[];
        vocabulary?: {
            preferredTerms?: Record<string, string> | undefined;
            avoidedTerms?: Record<string, string> | undefined;
        } | undefined;
    };
    metadata: {
        status: "active" | "draft" | "archived";
        createdAt: string;
        updatedAt: string;
        version: number;
    };
    description?: string | undefined;
    visual?: {
        colors: {
            primary: string;
            secondary?: string | undefined;
            accent?: string | undefined;
            text?: string | undefined;
            background?: string | undefined;
        };
        typography?: {
            primaryFont: string;
            secondaryFont?: string | undefined;
            headingFont?: string | undefined;
        } | undefined;
        logo?: {
            primary: string;
            secondary?: string | undefined;
            favicon?: string | undefined;
        } | undefined;
    } | undefined;
    contentGuidelines?: {
        maxHeadingLength?: number | undefined;
        paragraphStyle?: "short" | "medium" | "long" | undefined;
        preferredFormats?: string[] | undefined;
        contentTypes?: string[] | undefined;
        tonalRules?: string[] | undefined;
    } | undefined;
}>;
export type BrandContext = z.infer<typeof BrandContextSchema>;
/**
 * Create a new brand context
 */
export declare function createBrandContext(data: Omit<BrandContext, 'metadata'> & {
    status?: 'active' | 'draft' | 'archived';
}): BrandContext;
/**
 * Update an existing brand context
 */
export declare function updateBrandContext(existing: BrandContext, updates: Partial<Omit<BrandContext, 'id' | 'metadata'>>): BrandContext;
//# sourceMappingURL=brandContext.d.ts.map