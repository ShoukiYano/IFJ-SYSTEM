import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function reset() {
    try {
        const email = 'yanopitrombone@gmail.com';
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await (prisma as any).user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log('--- Password Reset ---');
        console.log('User updated:', user.email);
        console.log('New password set to: ' + newPassword);
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

reset();
