import { pool } from '../config/database';
import * as migration001 from './001_initial_schema';
import * as migration002 from './002_add_customer_fields';
import * as migration003 from './003_add_ticket_history';
import * as migration004 from './004_add_comments';
import * as migration005 from './005_add_description_image';
import * as migration006 from './006_add_email_logs';

const runMigrations = async () => {
  try {
    console.log('Starting database migrations...');

    await migration001.up(pool);
    await migration002.up(pool);
    await migration003.up(pool);
    await migration004.up(pool);
    await migration005.up(pool);
    await migration006.up(pool);

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

runMigrations();
