import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function create() {
    try {
        const email = 'admin@example.com';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await (prisma as any).user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'SYSTEM_ADMIN',
                name: 'Admin'
            },
            create: {
                email,
                password: hashedPassword,
                role: 'SYSTEM_ADMIN',
                name: 'Admin'
            }
        });

        console.log('--- User Created/Updated ---');
        console.log('User:', user.email);
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

create();
