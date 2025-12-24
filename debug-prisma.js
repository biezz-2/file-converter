const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

console.log('Testing PrismaClient initialization...');

try {
    const db = new Database('./dev.db');
    console.log('Database opened');
    const adapter = new PrismaBetterSqlite(db);
    console.log('Adapter created');
    const prisma = new PrismaClient({ adapter });
    console.log('Prisma Client initialized successfully');
} catch (e) {
    console.error('Initialization failed:', e);
}
