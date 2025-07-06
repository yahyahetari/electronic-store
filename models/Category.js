import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parent: { type: mongoose.Types.ObjectId, ref: 'Category' },
    properties: [{ type: Object }],
    products: [{ type: mongoose.Types.ObjectId, ref: 'Products' }],
    tags: [{ type: String }],
    image: { type: String },
});

// Add a pre-save hook to generate the slug if it's not provided
CategorySchema.pre('save', function(next) {
    if (!this.slug) {
      this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
  });

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
