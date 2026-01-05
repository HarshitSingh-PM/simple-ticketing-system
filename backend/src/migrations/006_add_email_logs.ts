import { Pool } from 'pg';

export const up = async (pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create email_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
        email_type VARCHAR(100) NOT NULL,
        recipient_emails TEXT NOT NULL,
        subject VARCHAR(500),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      );
    `);

    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_ticket_id ON email_logs(ticket_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
    `);

    await client.query('COMMIT');
    console.log('Migration 006_add_email_logs completed successfully');
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

    await client.query('DROP TABLE IF EXISTS email_logs CASCADE;');

    await client.query('COMMIT');
    console.log('Migration 006_add_email_logs rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
