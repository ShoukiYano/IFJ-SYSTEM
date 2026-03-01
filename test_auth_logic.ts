import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function manualAuthorize() {
    const credentials = {
        email: 'admin@example.com',
        password: 'admin123'
    };

    try {
        console.log('--- Manual Authorize Check ---');
        const user = await (prisma as any).user.findUnique({
            where: { email: credentials.email },
            include: { tenant: true },
        });

        if (!user) {
            console.log('Result: User NOT found in DB');
            return;
        }
        console.log('User found:', user.email);

        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log('Password valid:', isValid);

        if (isValid) {
            const sessionData = {
                id: user.id,
                email: user.email,
                name: user.name,
                tenantId: user.tenantId,
                tenantSubdomain: user.tenant?.subdomain,
                role: user.role,
                tosAccepted: !!(user as any).tosAcceptedAt,
            };
            console.log('Session Data to return:', sessionData);
        } else {
            console.log('Result: Invalid password');
        }
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

manualAuthorize();
