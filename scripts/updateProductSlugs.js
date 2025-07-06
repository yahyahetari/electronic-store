require('dotenv').config();
const { connectToDB } = require("../lib/mongoose");
const Product = require("../models/Products");

async function updateProductSlugs() {
    try {
        await connectToDB();

        const products = await Product.find({});

        for (const product of products) {
            if (!product.slug) {
                product.slug = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                await product.save();
                console.log(`Updated slug for product: ${product.title} -> ${product.slug}`);
            }
        }

        console.log("Finished updating product slugs");
    } catch (error) {
        console.error("Error updating product slugs:", error);
    } finally {
        process.exit(0);
    }
}

updateProductSlugs();
