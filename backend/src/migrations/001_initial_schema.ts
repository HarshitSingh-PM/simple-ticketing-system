import { Pool } from 'pg';

export const up = async (pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        must_change_password BOOLEAN DEFAULT FALSE,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create tickets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Pending', 'Closed')),
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        assigned_department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
        deadline TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP
      );
    `);

    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(assigned_department_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_deadline ON tickets(deadline);
    `);

    // Insert default departments
    await client.query(`
      INSERT INTO departments (name) VALUES
        ('Sales English'),
        ('Sales Arabic'),
        ('Finance'),
        ('Operations'),
        ('Procurement')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Insert default admin user (password: 'password')
    // Password hash for 'password' using bcrypt with salt rounds 10
    await client.query(`
      INSERT INTO users (name, email, password_hash, is_admin, must_change_password, department_id)
      VALUES ('Admin', 'admin@system.com', '$2b$10$45J3sILXz/x6DyOgGquxJe2ExhfPcYdb50CJLfDf5aZsENCY8d3j.', TRUE, TRUE, NULL)
      ON CONFLICT (email) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Migration 001_initial_schema completed successfully');
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

    await client.query('DROP TABLE IF EXISTS tickets CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');
    await client.query('DROP TABLE IF EXISTS departments CASCADE;');

    await client.query('COMMIT');
    console.log('Migration 001_initial_schema rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};
