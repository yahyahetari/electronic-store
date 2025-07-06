import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectToDB();

        const cartItems = req.body.items;
        
        if (!cartItems?.length) {
            return res.json([]);
        }

        const productIds = cartItems
            .map(item => item.id)
            .filter(id => mongoose.Types.ObjectId.isValid(id));

        const products = await Product.find({
            _id: { $in: productIds }
        });

        const enrichedProducts = products.map(product => {
            const cartItem = cartItems.find(item => item.id === product._id.toString());
            
            return {
                ...product.toObject(),
                variantId: cartItem?.variantId,
                properties: cartItem?.properties || {},
                price: cartItem?.price || product.price,
                quantity: cartItems.filter(item => 
                    item.id === product._id.toString() &&
                    item.variantId === cartItem?.variantId
                ).length
            };
        });

        res.status(200).json(enrichedProducts);

    } catch (error) {
        console.error('Cart API Error:', error);
        res.status(500).json({ 
            message: 'Error processing cart items',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
