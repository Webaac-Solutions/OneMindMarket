const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const Admin = require('./models/Admin');

const USERNAME = 'admin@onemind';
const PASSWORD = 'Onemind@1234';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const existing = await Admin.findOne({ username: USERNAME });
  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated password for existing admin user "${USERNAME}"`);
  } else {
    await Admin.create({ username: USERNAME, passwordHash });
    console.log(`Created new admin user "${USERNAME}"`);
  }

  console.log(`Login with username: ${USERNAME} / password: ${PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});