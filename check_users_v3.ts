import prisma from './src/lib/prisma';

async function checkUsers() {
    try {
        const users = await (prisma as any).user.findMany({
            select: { id: true, email: true, name: true, role: true, password: true }
        });

        console.log('--- Current Users in DB ---');
        for (const user of users) {
            console.log(`Email: [${user.email}], Role: ${user.role}, Name: ${user.name}, HasPwd: ${!!user.password}`);
        }
        console.log('--- End ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await (prisma as any).$disconnect();
    }
}

checkUsers();
