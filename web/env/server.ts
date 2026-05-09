import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        UPDATE_SIGNING_PRIVATE_KEY_PEM: z.string().min(1).optional(),
        UPDATE_SIGNING_PRIVATE_KEY_PATH: z.string().min(1).optional(),
        UPDATE_SIGNING_KEY_ID: z.string().min(1).optional(),
    },
    runtimeEnv: {
        UPDATE_SIGNING_PRIVATE_KEY_PEM:
            process.env.UPDATE_SIGNING_PRIVATE_KEY_PEM,
        UPDATE_SIGNING_PRIVATE_KEY_PATH:
            process.env.UPDATE_SIGNING_PRIVATE_KEY_PATH,
        UPDATE_SIGNING_KEY_ID: process.env.UPDATE_SIGNING_KEY_ID,
    },
    emptyStringAsUndefined: true,
});
