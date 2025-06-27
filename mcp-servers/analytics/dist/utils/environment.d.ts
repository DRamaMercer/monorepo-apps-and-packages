import { z } from 'zod';
declare const environmentSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
}>;
export type Environment = z.infer<typeof environmentSchema>;
export declare const environment: Environment;
export {};
//# sourceMappingURL=environment.d.ts.map