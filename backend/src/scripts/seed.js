const API_URL = process.env.DOCKER
  ? 'http://backend:3002/api/v1/auth/register'
  : 'http://localhost:3002/api/v1/auth/register';

const usersToSeed = [
  {
    email: 'student4@adaptivecbc.com',
    phone: '0711111111',
    firstName: 'Grade4',
    lastName: 'Student',
    role: 'student',
    password: 'Password123!',
  },
  {
    email: 'candidate6@adaptivecbc.com',
    phone: '0722222222',
    firstName: 'Grade6',
    lastName: 'Candidate',
    role: 'student',
    password: 'Password123!',
  },
  {
    email: 'candidate9@adaptivecbc.com',
    phone: '0733333333',
    firstName: 'Grade9',
    lastName: 'Candidate',
    role: 'student',
    password: 'Password123!',
  },
  {
    email: 'parent@adaptivecbc.com',
    phone: '0744444444',
    firstName: 'Jane',
    lastName: 'Parent',
    role: 'parent',
    password: 'Password123!',
  },
  {
    email: 'teacher@adaptivecbc.com',
    phone: '0755555555',
    firstName: 'Mr. John',
    lastName: 'Teacher',
    role: 'teacher',
    password: 'Password123!',
  },
  {
    email: 'tutor@adaptivecbc.com',
    phone: '0766666666',
    firstName: 'Mrs. Sarah',
    lastName: 'Tutor',
    role: 'tutor',
    password: 'Password123!',
  },
  {
    email: 'admin@adaptivecbc.com',
    phone: '0777777777',
    firstName: 'Admin',
    lastName: 'Super',
    role: 'super_admin',
    password: 'Password123!',
  },
  {
    email: 'institution@adaptivecbc.com',
    phone: '0788888888',
    firstName: 'Institution',
    lastName: 'Admin',
    role: 'institution_admin',
    password: 'Password123!',
  }
];

async function seed() {
  console.log('Seeding Database with sample accounts...');
  
  for (const user of usersToSeed) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Successfully seeded user: ${user.email}`);
      } else {
        if (response.status === 409 || (data.message && data.message.includes('already exists'))) {
            console.log(`⚠️ User already exists: ${user.email}`);
        } else {
            console.error(`❌ Error seeding ${user.email}:`, data.message || response.statusText);
        }
      }
    } catch (error) {
      console.error(`❌ Fetch error for ${user.email}:`, error.message);
    }
  }
  
  console.log('Database seeding completed.');
}

seed();
