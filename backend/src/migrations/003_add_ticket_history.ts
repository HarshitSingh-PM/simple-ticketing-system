import { Pool } from 'pg';

export const up = async (pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create ticket_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_history (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        change_type VARCHAR(100) NOT NULL,
        field_name VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON ticket_history(created_at);
    `);

    await client.query('COMMIT');
    console.log('Migration 003_add_ticket_history completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const down = async (pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS ticket_history CASCADE;');

    await client.query('COMMIT');
    console.log('Migration 003_add_ticket_history rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
