import { z, type ZodError } from "zod";

const semverSchema = z
    .string()
    .trim()
    .regex(/^\d+\.\d+\.\d+$/, "Use semantic versioning, e.g. 1.0.0");

const optionalDateSchema = z
    .string()
    .datetime()
    .transform((value) => new Date(value))
    .optional();

export const platformSchema = z.enum(["mac", "windows"]);
export const updateStatusSchema = z.enum([
    "started",
    "downloaded",
    "installed",
    "failed",
]);

export const releaseIdParamsSchema = z.object({
    id: z.string().min(1),
});

export const releaseVersionParamsSchema = z.object({
    version: semverSchema,
});

export const platformQuerySchema = z.object({
    platform: platformSchema,
});

export const latestReleaseQuerySchema = platformQuerySchema;

export const createReleaseSchema = z
    .object({
        version: semverSchema,
        releaseNotes: z.string().trim().min(1),
        isEnabled: z.boolean().optional(),
    })
    .strict();

export const updateReleaseSchema = z
    .object({
        version: semverSchema.optional(),
        releaseNotes: z.string().trim().min(1).optional(),
        isEnabled: z.boolean().optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field is required",
    });

export const createLogSchema = z
    .object({
        clientId: z.string().trim().min(1),
        fromVersion: semverSchema.nullable(),
        toVersion: semverSchema,
        platform: platformSchema,
        status: updateStatusSchema,
        errorMessage: z.string().trim().min(1).optional(),
    })
    .strict();

export const adminLogsQuerySchema = z.object({
    platform: platformSchema.optional(),
    status: updateStatusSchema.optional(),
    version: semverSchema.optional(),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
});

export const uploadFormSchema = z.object({
    platform: platformSchema,
    file: z.custom<File>(
        (value) => value instanceof File && value.size > 0,
        "A non-empty file is required",
    ),
});

export function validationError(error: ZodError): { error: string } {
    const issue = error.issues[0];
    const path = issue.path.join(".");
    return {
        error: path ? `${path}: ${issue.message}` : issue.message,
    };
}
