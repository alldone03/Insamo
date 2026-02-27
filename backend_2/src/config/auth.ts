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
    advanced: {
        database: {
            generateId: (options: any) => {
                if (options.model === "user") {
                    return false; // Let database auto-increment
                }
                return generateId(); 
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        password: {
            hash: async (password: string) => password,
            verify: async (password: string, hash: string) => {
                console.log('Plain text verify:', { password, hash, match: password === hash });
                return password === hash;
            },
        },
    },
    plugins: [
        jwt({
            jwt: {
                secret: process.env.JWT_SECRET || "fallback_secret",
            },
        }),
    ],
});
