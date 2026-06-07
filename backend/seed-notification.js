const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  host: '127.0.0.1',
  port: 5434,
  user: 'cbc_user',
  password: 'cbc_secure_pass_2024',
  database: 'adaptive_cbc',
});

async function main() {
  await client.connect();
  try {
    // 1. Get user id for admin
    const userRes = await client.query("SELECT id FROM users WHERE email = 'admin@adaptivecbc.co.ke';");
    if (userRes.rows.length === 0) {
      console.log("Admin user not found.");
      return;
    }
    const adminId = userRes.rows[0].id;
    console.log(`Found Admin User ID: ${adminId}`);

    // 2. Insert test notifications
    const notifications = [
      {
        id: uuidv4(),
        userId: adminId,
        title: 'New KYC Request',
        message: 'Tutor Jane Doe has submitted a new KYC verification request.',
        type: 'security',
        priority: 'high',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        userId: adminId,
        title: 'System Update Successful',
        message: 'The automated database cleanup completed successfully in 234ms.',
        type: 'system',
        priority: 'low',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000),
      }
    ];

    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (id, "userId", title, message, type, priority, "isRead", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [n.id, n.userId, n.title, n.message, n.type, n.priority, n.isRead, n.createdAt, n.updatedAt]
      );
      console.log(`Inserted notification: ${n.title}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
