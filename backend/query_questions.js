const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5434,
  database: 'adaptive_cbc',
  user: 'cbc_user',
  password: 'cbc_secure_pass_2024',
});

async function main() {
  await client.connect();
  try {
    const updateRes = await client.query("UPDATE questions SET status = 'approved';");
    console.log('Update result:', updateRes.rowCount, 'questions updated to approved.');

    const res = await client.query('SELECT status, COUNT(*) FROM questions GROUP BY status;');
    console.log('Question statuses:');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
