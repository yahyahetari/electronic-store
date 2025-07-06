import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await connectToDB();
    const { items } = req.body;

    try {
        const products = await Product.find({
            _id: { $in: items.map(item => item.productId) }
        });

        // Group items by product ID and properties to sum quantities
        const groupedItems = items.reduce((acc, item) => {
            const key = `${item.productId}-${JSON.stringify(item.properties)}`;
            if (!acc[key]) {
                acc[key] = { ...item, totalQuantity: 0 };
            }
            acc[key].totalQuantity += item.quantity;
            return acc;
        }, {});

        // Check each grouped item against stock
        for (const groupedItem of Object.values(groupedItems)) {
            const product = products.find(p => p._id.toString() === groupedItem.productId);
            if (!product) continue;

            const variant = product.variants.find(v => {
                return Object.entries(groupedItem.properties).every(([key, value]) => 
                    v.properties[key]?.[0] === value
                );
            });

            if (!variant || variant.stock < groupedItem.totalQuantity) {
                const variantDesc = Object.entries(groupedItem.properties)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' - ');

                return res.json({
                    success: false,
                    message: `${product.title} (${variantDesc}) - الكمية المطلوبة ${groupedItem.totalQuantity} والمتوفر ${variant?.stock || 0} قطع`
                });
            }
        }

        return res.json({
            success: true,
            message: 'تم التحقق من المخزون بنجاح'
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'يرجى المحاولة مرة أخرى'
        });
    }
}
