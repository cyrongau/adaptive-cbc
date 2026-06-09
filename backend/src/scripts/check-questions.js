const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'postgres',
    port: 5432,
    user: 'cbc_user',
    password: 'cbc_secure_pass_2024',
    database: 'adaptive_cbc',
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query(`SELECT id, email, role, grade FROM users WHERE role = 'student';`);
    console.log('Students in DB:');
    console.table(res.rows);

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await client.end();
  }
}

main();
