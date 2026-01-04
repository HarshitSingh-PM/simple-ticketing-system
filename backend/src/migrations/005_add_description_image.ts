import { Pool } from 'pg';

export const up = async (pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Add description_image_url column to tickets table
    await client.query(`
      ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS description_image_url VARCHAR(500);
    `);

    await client.query('COMMIT');
    console.log('Migration 005_add_description_image completed successfully');
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
      DROP COLUMN IF EXISTS description_image_url;
    `);

    await client.query('COMMIT');
    console.log('Migration 005_add_description_image rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
