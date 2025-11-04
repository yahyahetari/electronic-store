import { Order } from "@/models/Order";
import { Product } from "@/models/Products";
import { buffer } from "micro";

const stripe = require('stripe')(process.env.STRIPE_SK);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const SHIPPING_COST = 2000;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const buf = await buffer(req);

    let event;
    try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;
        const paid = session.payment_status === 'paid';

        if (paid) {
            try {
                // إعادة بناء بيانات الطلب من metadata
                const orderIds = metadata.orderIds.split(',');
                const quantities = metadata.quantities.split(',').map(Number);
                const prices = metadata.prices.split(',').map(Number);
                const properties = JSON.parse(metadata.properties || '[]');
                const [firstName, lastName] = metadata.customerName.split(' ');
                const [email, phone] = metadata.contactInfo.split('|');
                const [address, city, country, postalCode] = metadata.shippingAddress.split('|');
                const address2 = metadata.address2 || '';
                const state = metadata.state || '';

                // جلب تفاصيل المنتجات
                const products = await Product.find({ _id: { $in: orderIds } });

                const orderItems = orderIds.map((id, index) => {
                    const product = products.find(p => p._id.toString() === id);
                    return {
                        productId: id,
                        title: product.title,
                        quantity: quantities[index],
                        price: prices[index],
                        properties: properties[index] || {},
                        image: product.images?.[0] || ''
                    };
                });

                const totalAmount = orderItems.reduce((sum, item) => 
                    sum + (item.price * item.quantity), 0) + SHIPPING_COST / 100;

                const orderDoc = await Order.create({
                    items: orderItems,
                    totalAmount,
                    firstName,
                    lastName,
                    email,
                    phone,
                    address,
                    address2,
                    state,
                    city,
                    country,
                    postalCode,
                    notes: metadata.additionalInfo,
                    shippingCost: SHIPPING_COST / 100,
                    paid: true,
                    paymentId: session.payment_intent
                });

                // تحديث مخزون المنتجات
                for (let i = 0; i < orderIds.length; i++) {
                    const product = products.find(p => p._id.toString() === orderIds[i]);
                    if (product) {
                        // إذا كان المنتج يحتوي على متغيرات
                        if (product.variants && product.variants.length > 0) {
                            const variantProps = properties[i] || {};
                            const variant = product.variants.find(v => 
                                Object.keys(variantProps).every(
                                    key => v.properties[key] === variantProps[key]
                                )
                            );
                            if (variant) {
                                variant.stock -= quantities[i];
                            }
                        } else {
                            // إذا لم يكن لديه متغيرات، تحديث المخزون الرئيسي
                            product.stock -= quantities[i];
                        }
                        await product.save();
                    }
                }

            } catch (err) {
                console.error('Order processing error:', err);
                return res.status(500).json({ message: 'Error processing order' });
            }
        }
    }

    res.json({ received: true });
}

export const config = {
    api: {
        bodyParser: false,
    },
};