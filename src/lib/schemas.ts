import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Mindestens 3 Zeichen")
      .max(20, "Maximal 20 Zeichen")
      .regex(/^[a-zA-Z0-9_]+$/, "Nur Buchstaben, Zahlen und _"),
    email: z.string().email("Ungültige E-Mail"),
    password: z.string().min(8, "Mindestens 8 Zeichen"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirm"],
  });

export const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(1, "Passwort erforderlich"),
});

export const soloStartSchema = z.object({
  problem_id: z.string().uuid(),
});

export const soloSubmitSchema = z.object({
  session_id: z.string().uuid(),
  code: z.string().min(1, "Code darf nicht leer sein"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
