import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function verify() {
    try {
        const email = 'yanopitrombone@gmail.com';
        const password = 'admin123';

        const user = await (prisma as any).user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);

        console.log('--- Verification ---');
        console.log('User:', user.email);
        console.log('Stored Hash:', user.password);
        console.log('Is valid:', isValid);
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

verify();
