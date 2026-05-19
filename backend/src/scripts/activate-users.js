const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'cbc_user',
  password: process.env.DATABASE_PASSWORD || 'cbc_secure_pass_2024',
  database: process.env.DATABASE_NAME || 'adaptive_cbc',
  synchronize: false,
});

async function activateUsers() {
  await ds.initialize();
  const result = await ds.query(
    "UPDATE users SET \"isActive\" = true WHERE email LIKE '%@adaptivecbc.com%'"
  );
  console.log('Activated users:', result);
  await ds.destroy();
}

activateUsers();