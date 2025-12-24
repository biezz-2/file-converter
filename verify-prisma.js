const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

console.log('Verifying Prisma Adapter...');

try {
    // Simulate db.ts logic
    const dbPath = './dev.db';
    const db = new Database(dbPath);
    console.log('BetterSqlite3 Database opened');

    const adapter = new PrismaBetterSqlite3(db);
    console.log('PrismaBetterSqlite3 Adapter created');

    const prisma = new PrismaClient({ adapter });
    console.log('Prisma Client initialized');

    // Test connection
    prisma.$connect().then(() => {
        console.log('Prisma Connected Successfully!');
        process.exit(0);
    }).catch(e => {
        console.error('Prisma connection failed:', e);
        process.exit(1);
    });

} catch (e) {
    console.error('Initialization failed:', e);
    process.exit(1);
}
