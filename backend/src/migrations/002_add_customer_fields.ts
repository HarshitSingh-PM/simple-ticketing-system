import { Pool } from 'pg';

export const up = async (pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Add customer fields to tickets table
    await client.query(`
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50),
      ADD COLUMN IF NOT EXISTS car_bought VARCHAR(255);
    `);

    await client.query('COMMIT');
    console.log('Migration 002_add_customer_fields completed successfully');
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

    await client.query(`
      ALTER TABLE tickets
      DROP COLUMN IF EXISTS customer_name,
      DROP COLUMN IF EXISTS customer_mobile,
      DROP COLUMN IF EXISTS car_bought;
    `);

    await client.query('COMMIT');
    console.log('Migration 002_add_customer_fields rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
