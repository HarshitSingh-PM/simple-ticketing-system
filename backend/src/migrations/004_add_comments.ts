import { Pool } from 'pg';

export const up = async (pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create ticket_comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        comment_text TEXT NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);
    `);

    await client.query('COMMIT');
    console.log('Migration 004_add_comments completed successfully');
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

    await client.query('DROP TABLE IF EXISTS ticket_comments CASCADE;');

    await client.query('COMMIT');
    console.log('Migration 004_add_comments rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
