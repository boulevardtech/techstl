export async function initializeDatabase(pool, logger = console) {
  try {
    await pool.query('SELECT NOW()');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.log('Database initialized successfully.');
    return { dbReady: true, message: 'Database initialized successfully.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Database unavailable: ${message}`);
    return { dbReady: false, message: `Database unavailable: ${message}` };
  }
}
