import prisma from './src/lib/prisma';

async function check() {
    try {
        const userCount = await (prisma as any).user.count();
        const allUsers = await (prisma as any).user.findMany({
            select: { email: true, role: true, name: true, tenantId: true }
        });

        console.log('--- DB Check ---');
        console.log('Total users:', userCount);
        console.log('All Users:', allUsers);
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

check();
