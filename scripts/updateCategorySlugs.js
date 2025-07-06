require('dotenv').config();
const { connectToDB } = require("../lib/mongoose");
const Category = require("../models/Category");

async function updateSlugs() {
    try {
        await connectToDB();

        const categories = await Category.find({});

        for (const category of categories) {
            if (!category.slug) {
                category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                await category.save();
                console.log(`Updated slug for category: ${category.name} -> ${category.slug}`);
            }
        }

        console.log("Finished updating category slugs");
    } catch (error) {
        console.error("Error updating category slugs:", error);
    } finally {
        process.exit(0);
    }
}

updateSlugs();
