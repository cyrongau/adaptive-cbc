const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER || 'cbc_user',
    password: process.env.DATABASE_PASSWORD || 'cbc_secure_pass_2024',
    database: process.env.DATABASE_NAME || 'adaptive_cbc',
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const statusRes = await client.query('SELECT id, email, role, "firstName", "lastName", "isActive" FROM users;');
    console.log(JSON.stringify(statusRes.rows, null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await client.end();
  }
}

main();
