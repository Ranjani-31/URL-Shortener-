const { z } = require("zod");

const originalUrlSchema = z
  .string()
  .trim()
  .url("Invalid URL")
  .refine((value) => {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  }, "Only HTTP and HTTPS URLs are allowed");

const expiresAtSchema = z.iso.datetime();

const createUrlSchema = z.object({
  originalUrl: originalUrlSchema,
  alias: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Alias must contain at least 3 characters")
    .max(30, "Alias cannot exceed 30 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Alias can contain only letters, numbers and hyphens"
    )
    .optional(),
  expiresAt: expiresAtSchema.optional(),
}).strict();

const updateUrlSchema = z
  .object({
    originalUrl: originalUrlSchema,
    expiresAt: expiresAtSchema.nullable(),
    isActive: z.boolean().optional(),
  })
  .strict();

const updateUrlStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

const urlIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid URL id"),
});

const redirectParamsSchema = z.object({
  shortCode: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

module.exports = {
  createUrlSchema,
  updateUrlSchema,
  updateUrlStatusSchema,
  urlIdParamsSchema,
  redirectParamsSchema,
};