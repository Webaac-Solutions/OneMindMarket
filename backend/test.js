// Run from inside backend/ folder:
//   node test.js

const mongoose = require('mongoose');
const Customer = require('./models/Customer');

const MONGO_URI = 'mongodb+srv://onemindmarketinfo_db_user:jetaqNSnrTVNgcZT@cluster0.ho8wcd5.mongodb.net/OneMindSearchEngine';

const AFFECTED_SHOPS = [
  'AL MAQAM CONSTRUCTION & INTERIOR',
  'SRM HOME DECORS',
  'Kms Constructions',
  'Gem Steels',
  'SAN GRUP',
  'Block And Space Architects',
  'Hotel Aryaas Katpadi',
];

async function fixDuplicatePhotos() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  let fixed = 0;
  let skipped = 0;
  let missing = 0;

  for (const shopName of AFFECTED_SHOPS) {
    const customer = await Customer.findOne({
      shopName: { $regex: new RegExp(`^${shopName}$`, 'i') },
    });

    if (!customer) {
      console.log(`❓ NOT FOUND : ${shopName}`);
      missing++;
      continue;
    }

    const before    = [...(customer.shopPhotos || [])];
    const mainPhoto = customer.shopPhoto;

    const cleaned = [...new Set(before)].filter(f => f !== mainPhoto);

    if (cleaned.length === before.length) {
      console.log(`✔  OK (no change) : ${shopName}`);
      skipped++;
      continue;
    }

    customer.shopPhotos = cleaned;
    await customer.save();
    fixed++;

    console.log(`🔧 FIXED : ${shopName}`);
    console.log(`   shopPhoto (main) : ${mainPhoto}`);
    console.log(`   Before           : [${before.join(', ')}]`);
    console.log(`   After            : [${cleaned.join(', ')}]`);
    console.log();
  }

  console.log('─'.repeat(50));
  console.log(`Fixed: ${fixed}  |  Already OK: ${skipped}  |  Not found: ${missing}`);

  await mongoose.disconnect();
  console.log('\nDone. Safe to delete this script.');
}

fixDuplicatePhotos().catch(err => {
  console.error(err);
  process.exit(1);
});