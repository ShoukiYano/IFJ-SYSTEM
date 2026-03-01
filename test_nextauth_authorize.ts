import { authOptions } from './src/lib/auth';
import prisma from './src/lib/prisma';

async function testNextAuthAuthorize() {
    const credentials = {
        email: 'admin@example.com',
        password: 'admin123'
    };

    try {
        console.log('--- NextAuth Authorize Test ---');
        // Simulate the authorize call as NextAuth would
        const user = await authOptions.providers.find(p => p.id === 'credentials').authorize(credentials, {} as any);

        if (user) {
            console.log('Authorize SUCCESS');
            console.log('Result User:', JSON.stringify(user, null, 2));
        } else {
            console.log('Authorize FAILED (returned null)');
        }
        console.log('--- End ---');
    } catch (error: any) {
        console.error('Authorize ERROR:', error.message);
    } finally {
        await (prisma as any).$disconnect();
    }
}

testNextAuthAuthorize();
