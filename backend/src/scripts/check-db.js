const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5434,
    user: 'cbc_user',
    password: 'cbc_secure_pass_2024',
    database: 'adaptive_cbc',
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const statusRes = await client.query('SELECT status, COUNT(*) FROM questions GROUP BY status;');
    console.log('Questions by status:');
    console.table(statusRes.rows);

    const questionsRes = await client.query('SELECT id, content, status, grade, "subjectId", "topicId" FROM questions LIMIT 10;');
    console.log('Sample questions:');
    console.table(questionsRes.rows);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await client.end();
  }
}

main();
