import { db } from './server/db';
import { questionBank } from '@shared/schema';

async function clear() {
    console.log('Clearing out old LLM questions from caching database...');
    await db.delete(questionBank);
    console.log('Done!');
    process.exit(0);
}
clear();
