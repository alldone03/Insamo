import { betterAuth, generateId } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database";
import { jwt } from "better-auth/plugins";

import * as schema from "../app/models/schema";

import bcrypt from "bcryptjs";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        jwt()
    ],
    secret: process.env.JWT_SECRET || "fallback_secret",
});
