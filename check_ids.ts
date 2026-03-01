import prisma from './src/lib/prisma';

async function checkIds() {
    try {
        const users = await (prisma as any).user.findMany({
            select: { id: true, email: true }
        });

        console.log('--- ID Check ---');
        for (const user of users) {
            console.log(`Email: [${user.email}], ID: [${user.id}]`);
        }
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

checkIds();
