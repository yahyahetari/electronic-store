import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";

const stripe = require('stripe')(process.env.STRIPE_SK);
const SHIPPING_COST = 2000;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send({ error: 'الطريقة غير مسموح بها' });
    }

    try {
        await connectToDB();
        const { firstName, lastName, email, phone, address, address2, state, city, country, postalCode, cartItems, notes } = req.body;

        if (!firstName || !lastName || !email || !phone || !address || !city || !country || !postalCode || !cartItems) {
            return res.status(400).send({ error: 'حقول مطلوبة مفقودة' });
        }

        const cartItemsArray = JSON.parse(cartItems);
        const uniqueIds = [...new Set(cartItemsArray.map(item => item.id))];
        const productsData = await Product.find({ _id: { $in: uniqueIds } });

        let line_items = cartItemsArray.map(cartItem => {
            const productInfo = productsData.find(p => p._id.toString() === cartItem.id);
            if (!productInfo) return null;

            return {
                quantity: cartItem.quantity,
                price_data: {
                    currency: 'SAR',
                    product_data: {
                        name: productInfo.title,
                        description: cartItem.properties ? 
                            Object.entries(cartItem.properties)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', ') : ''
                    },
                    unit_amount: Math.round(cartItem.price * 100),
                }
            };
        }).filter(Boolean);

        line_items.push({
            quantity: 1,
            price_data: {
                currency: 'SAR',
                product_data: {
                    name: 'رسوم التوصيل',
                    description: 'خدمة التوصيل'
                },
                unit_amount: SHIPPING_COST,
            }
        });

        // إنشاء metadata مع خصائص المنتجات
        const metadata = {
            orderIds: cartItemsArray.map(item => item.id).join(','),
            quantities: cartItemsArray.map(item => item.quantity).join(','),
            prices: cartItemsArray.map(item => item.price).join(','),
            properties: JSON.stringify(cartItemsArray.map(item => item.properties || {})),
            customerName: `${firstName} ${lastName}`,
            contactInfo: `${email}|${phone}`,
            shippingAddress: `${address}|${city}|${country}|${postalCode}`,
            additionalInfo: notes || '',
            address2: address2 || '',
            state: state || ''
        };

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            customer_email: email,
            success_url: `${process.env.NEXT_PUBLIC_STORE_URL}/paysuccess`,
            cancel_url: `${process.env.NEXT_PUBLIC_STORE_URL}/cart`,
            metadata: metadata
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'خطأ في الخادم الداخلي' });
    }
}