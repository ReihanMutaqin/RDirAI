import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: Number(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER || '2cpECGyEi7tkhJp.root',
  password: process.env.TIDB_PASSWORD || 'fo0KkH8OQLI8WRig',
  database: process.env.TIDB_DATABASE || 'test',
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

let dbInitialized = false;

export async function initDb() {
  if (dbInitialized) return;
  try {
    const connection = await pool.getConnection();

    // Create users table for strict data isolation
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create conversations table with user_id scoping
    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) DEFAULT 'default_user',
        title VARCHAR(255) NOT NULL,
        model VARCHAR(128) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure user_id column exists if table was created previously
    try {
      await connection.query(`ALTER TABLE conversations ADD COLUMN user_id VARCHAR(64) DEFAULT 'default_user';`);
    } catch (e) {
      // Column already exists
    }

    // Create messages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        content LONGTEXT NOT NULL,
        model VARCHAR(128),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation (conversation_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    connection.release();
    dbInitialized = true;
    console.log('TiDB multi-user isolated database schema initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize TiDB database tables:', error);
  }
}

export default pool;
