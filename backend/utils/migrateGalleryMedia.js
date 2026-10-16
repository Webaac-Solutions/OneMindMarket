const Gallery = require('../models/Gallery');

async function migrateGalleryMedia() {
  try {
    const items = await Gallery.find({
      images: { $exists: true, $not: { $size: 0 } },
      $or: [{ media: { $exists: false } }, { media: { $size: 0 } }]
    }).lean();

    if (items.length === 0) return;

    console.log(`Migrating ${items.length} gallery items from images[] to media[]...`);
    for (const item of items) {
      const media = item.images.map(img => ({ type: "image", url: img }));
      await Gallery.updateOne({ _id: item._id }, { $set: { media } });
    }
    console.log("Gallery media migration complete.");
  } catch (err) {
    console.error("Error migrating gallery media:", err);
  }
}

module.exports = migrateGalleryMedia;
