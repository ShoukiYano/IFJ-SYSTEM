import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

// Manually recreated authorize logic from auth.ts to see logs definitively
async function standaloneAuthorize(credentials: any) {
    console.log("[DEBUG] Standalone Authorize called with email:", credentials?.email);
    if (!credentials?.email || !credentials?.password) {
        console.log("[DEBUG] Missing credentials");
        return null;
    }

    const user = await (prisma as any).user.findUnique({
        where: { email: credentials.email },
        include: { tenant: true },
    });

    if (!user) {
        console.log("[DEBUG] User not found in DB:", credentials.email);
        return null;
    }

    console.log("[DEBUG] User found, comparing password...");

    if (!user.password) {
        console.log("[DEBUG] User has no password set");
        return null;
    }

    const isValid = await bcrypt.compare(credentials.password, user.password);
    console.log("[DEBUG] Password valid:", isValid);

    if (!isValid) {
        console.log("[DEBUG] Password mismatch");
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
}

async function run() {
    const result = await standaloneAuthorize({
        email: 'admin@example.com',
        password: 'admin123'
    });
    console.log("Final Result:", result);
    await (prisma as any).$disconnect();
}

run();
