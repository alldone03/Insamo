import { db } from './src/config/database';
import { users } from './src/app/models/schema';

async function main() {
    const results = await db.select().from(users);
    console.log('User 0:', JSON.stringify(results[0], null, 2));
}

main().catch(console.error);
