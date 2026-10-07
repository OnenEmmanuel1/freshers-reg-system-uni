const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'rootpassword',
  database: process.env.DB_NAME || 'unicross_freshers_reg_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true
};

async function runSeed() {
  let connection;
  try {
    console.log('===========================================================');
    console.log('🌱 UniRegister (hfrs-) Database Seeder');
    console.log(`📡 Connecting to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}...`);
    console.log('===========================================================');

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection established.');

    // Step 1: Ensure tables exist by running schema if needed
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('📋 No tables found. Initializing schema from schema.sql first...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schemaSql);
        console.log('✅ Schema tables and indexes created successfully.');
      }
    }

    // Step 2: Run seed.sql
    console.log('🌱 Applying seed data from seed.sql...');
    const seedPath = path.join(__dirname, 'seed.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`seed.sql file not found at ${seedPath}`);
    }

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);

    // Step 3: Verify seeded record counts
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [profiles] = await connection.query('SELECT COUNT(*) as count FROM student_profiles');
    const [registrations] = await connection.query('SELECT COUNT(*) as count FROM registrations');
    const [payments] = await connection.query('SELECT COUNT(*) as count FROM payments');
    const [documents] = await connection.query('SELECT COUNT(*) as count FROM documents');

    console.log('===========================================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary of records:`);
    console.log(`   - Users:            ${users[0].count}`);
    console.log(`   - Student Profiles: ${profiles[0].count}`);
    console.log(`   - Registrations:    ${registrations[0].count}`);
    console.log(`   - Payments:         ${payments[0].count}`);
    console.log(`   - Documents:        ${documents[0].count}`);
    console.log('===========================================================');
    console.log('🔑 Default Test Credentials:');
    console.log('   Admin:   admin@unicross.edu.ng               | password123');
    console.log('   Student: jane.smith@student.unicross.edu.ng  | password123');
    console.log('   Student: michael.j@student.unicross.edu.ng   | password123');
    console.log('   Student: sarah.w@student.unicross.edu.ng    | password123');
    console.log('   Student: david.o@student.unicross.edu.ng    | password123');
    console.log('===========================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSeed();
