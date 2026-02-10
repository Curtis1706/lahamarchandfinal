const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma otpCode model...');
    try {
        const keys = Object.keys(prisma);
        if (keys.includes('otpCode')) {
            console.log('✅ otpCode is available in Prisma client');
        } else {
            console.log('❌ otpCode NOT found in Prisma client');
            console.log('Available models:', keys.filter(k => !k.startsWith('$')));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
