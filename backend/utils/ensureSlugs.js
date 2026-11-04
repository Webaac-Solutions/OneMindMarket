const Customer = require('../models/Customer');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Article = require('../models/Article');
const Gallery = require('../models/Gallery');

async function ensureSlugs() {
  try {
    // Backfill customers
    const customers = await Customer.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (customers && customers.length > 0) {
      console.log(`Found ${customers.length} customers without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const c of customers) {
        let base = slugify(c.shopName || 'shop');
        let slug = base;
        let i = 1;
        while (await Customer.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Customer.findByIdAndUpdate(c._id, { slug });
      }
    }

    // Backfill categories
    const categories = await Category.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (categories && categories.length > 0) {
      console.log(`Found ${categories.length} categories without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const c of categories) {
        let base = slugify(c.name || 'category');
        let slug = base;
        let i = 1;
        while (await Category.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Category.findByIdAndUpdate(c._id, { slug });
      }
    }

    // Backfill locations
    const locations = await Location.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (locations && locations.length > 0) {
      console.log(`Found ${locations.length} locations without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const l of locations) {
        let base = slugify(l.name || 'location');
        let slug = base;
        let i = 1;
        while (await Location.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Location.findByIdAndUpdate(l._id, { slug });
      }
    }
    // Backfill articles
    const articles = await Article.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (articles && articles.length > 0) {
      console.log(`Found ${articles.length} articles without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const a of articles) {
        let base = slugify(a.title || 'article');
        let slug = base;
        let i = 1;
        while (await Article.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Article.findByIdAndUpdate(a._id, { slug });
      }
    }
    // Backfill gallery items
    const galleryItems = await Gallery.find({ $or: [ { slug: { $exists: false } }, { slug: null } ] }).lean();
    if (galleryItems && galleryItems.length > 0) {
      console.log(`Found ${galleryItems.length} gallery items without slugs. Generating...`);
      function slugify(text) {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }
      for (const g of galleryItems) {
        let base = slugify(g.title || 'gallery');
        let slug = base;
        let i = 1;
        while (await Gallery.findOne({ slug })) {
          slug = `${base}-${i++}`;
        }
        await Gallery.findByIdAndUpdate(g._id, { slug });
      }
    }
    // Migrate old single-image gallery items to images array
    const oldGalleryItems = await Gallery.find({
      image: { $exists: true, $ne: null },
      $or: [{ images: { $exists: false } }, { images: { $size: 0 } }]
    }).lean();
    if (oldGalleryItems && oldGalleryItems.length > 0) {
      console.log(`Migrating ${oldGalleryItems.length} gallery items from image to images...`);
      for (const g of oldGalleryItems) {
        await Gallery.updateOne({ _id: g._id }, {
          $set: { images: [g.image] },
          $unset: { image: 1 }
        });
      }
    }
  } catch (err) {
    console.error('Error ensuring slugs:', err);
  }
}

module.exports = ensureSlugs;
