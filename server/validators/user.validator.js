const { z } = require("zod");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(50),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(72, "Password is too long"),
}).strict();

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  password: z.string().min(1, "Password is required"),
}).strict();

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(50),
}).strict();

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};