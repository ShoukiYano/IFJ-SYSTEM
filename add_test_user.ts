import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function addTestUser() {
    try {
        const email = 'test@example.com';
        const password = 'test123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await (prisma as any).user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'SYSTEM_ADMIN',
                name: 'Test Administrator'
            },
            create: {
                email,
                password: hashedPassword,
                role: 'SYSTEM_ADMIN',
                name: 'Test Administrator'
            }
        });

        console.log('--- Test User Added to DB ---');
        console.log('User:', user.email);
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

addTestUser();
