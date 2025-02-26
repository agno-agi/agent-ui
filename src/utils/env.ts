import { createEnv } from "@t3-oss/env-nextjs";
import { StandardSchemaV1 } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  onValidationError: (issues: readonly StandardSchemaV1.Issue[]) => {
    console.error("❌ Some environment variables are missing:", issues);
    throw new Error("Some environment variables are missing");
  },
  server: {},
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().min(1),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
});
