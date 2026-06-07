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
    const emails = [
      'student@adaptivecbc.com',
      'teacher@adaptivecbc.com',
      'parent@adaptivecbc.com',
      'tutor@adaptivecbc.com',
      'institution@adaptivecbc.com',
      'admin@adaptivecbc.co.ke'
    ];

    for (const email of emails) {
      const userRes = await client.query('SELECT id FROM users WHERE email = $1;', [email]);
      if (userRes.rows.length === 0) {
        console.log(`User ${email} not found.`);
        continue;
      }
      const userId = userRes.rows[0].id;
      console.log(`Found User ID for ${email}: ${userId}`);

      // Clear existing notifications first to avoid duplicate pollution
      await client.query('DELETE FROM notifications WHERE "userId" = $1;', [userId]);

      const notifications = [
        {
          id: uuidv4(),
          userId,
          title: 'Welcome to Adaptive CBC',
          message: 'Explore your customized dashboard, study materials, and learning tracks today!',
          type: 'academic',
          priority: 'medium',
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          userId,
          title: 'Daily Goal Alert',
          message: 'You are close to completing your daily study goal. Practice now to earn 150 XP!',
          type: 'system',
          priority: 'high',
          isRead: false,
          createdAt: new Date(Date.now() - 1800000), // 30 mins ago
          updatedAt: new Date(Date.now() - 1800000),
        }
      ];

      for (const n of notifications) {
        await client.query(
          `INSERT INTO notifications (id, "userId", title, message, type, priority, "isRead", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
          [n.id, n.userId, n.title, n.message, n.type, n.priority, n.isRead, n.createdAt, n.updatedAt]
        );
        console.log(`Inserted notification for ${email}: ${n.title}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
