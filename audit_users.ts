import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function audit() {
    try {
        const users = await (prisma as any).user.findMany({
            select: { email: true, role: true, name: true, password: true }
        });

        console.log('--- User Audit ---');
        for (const user of users) {
            const hasPassword = !!user.password;
            console.log(`Email: ${user.email}, Role: ${user.role}, Name: ${user.name}, HasPassword: ${hasPassword}`);
        }
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

audit();
