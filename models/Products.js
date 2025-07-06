import mongoose, { model, Schema, models } from "mongoose";

const ProductSchema = new Schema({
  title: {type: String, required: true},
  slug: {type: String, required: true, unique: true},
  description: String,
  images: [{type: String}],
  variants: [{
    properties: {type: Object},
    price: {type: Number, required: true},
    cost: {type: Number, required: true},
    stock: {type: Number, required: true}, // تغيير من Object إلى Number
  }],
  category: {type: mongoose.Types.ObjectId, ref: 'Category'},
  properties: {type: Object},
  ratings: [{
    rating: Number,
    review: String,
    user: {
      name: String,
      email: String,
      image: String
    },
    createdAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true,
});

// دالة مساعدة لإنشاء الـ slug
function createSlug(title) {
  return title
      .trim()
      .replace(/\s+/g, '--') // استبدال المسافات بشرطتين
      .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, ''); // السماح بالأحرف العربية والإنجليزية والأرقام
}

// تحديث الـ pre-save hook
ProductSchema.pre('save', async function(next) {
  if (!this.slug) {
    let baseSlug = createSlug(this.title);
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingProduct = await this.constructor.findOne({ slug: slug });
      if (!existingProduct) {
        this.slug = slug;
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  next();
});

export const Product = models.Product || model('Product', ProductSchema);
