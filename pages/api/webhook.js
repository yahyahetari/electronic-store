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
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;
        const paid = session.payment_status === 'paid';

        console.log('Processing checkout session:', session.id);
        console.log('Payment status:', session.payment_status);

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

                console.log('Order details:', { orderIds, quantities, properties });

                // جلب تفاصيل المنتجات
                const products = await Product.find({ _id: { $in: orderIds } });
                console.log('Found products:', products.length);

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

                // إنشاء الطلب مع status و viewed
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
                    notes: metadata.additionalInfo || '',
                    shippingCost: SHIPPING_COST / 100,
                    paid: true,
                    paymentId: session.payment_intent,
                    status: 'pending',
                    viewed: false
                });

                console.log('✅ Order created successfully:', orderDoc._id);

                // تحديث مخزون المنتجات
                for (let i = 0; i < orderIds.length; i++) {
                    const product = products.find(p => p._id.toString() === orderIds[i]);
                    if (!product) {
                        console.error(`❌ Product not found: ${orderIds[i]}`);
                        continue;
                    }

                    const orderedQuantity = quantities[i];
                    const variantProps = properties[i] || {};

                    console.log(`Processing product: ${product.title}`);
                    console.log(`Ordered properties:`, variantProps);

                    // إذا كان المنتج يحتوي على متغيرات
                    if (product.variants && product.variants.length > 0) {
                        console.log(`Product has ${product.variants.length} variants`);
                        
                        // البحث عن المتغير المطابق
                        let variantFound = false;
                        for (let variant of product.variants) {
                            // تحويل الخصائص لمقارنة دقيقة
                            const variantPropsNormalized = {};
                            const orderedPropsNormalized = {};
                            
                            // تطبيع خصائص المتغير
                            Object.keys(variant.properties || {}).forEach(key => {
                                variantPropsNormalized[key.trim()] = String(variant.properties[key]).trim();
                            });
                            
                            // تطبيع الخصائص المطلوبة
                            Object.keys(variantProps).forEach(key => {
                                orderedPropsNormalized[key.trim()] = String(variantProps[key]).trim();
                            });

                            console.log('Comparing variant:', variantPropsNormalized);
                            console.log('With ordered:', orderedPropsNormalized);

                            // مقارنة الخصائص
                            const keysMatch = Object.keys(orderedPropsNormalized).every(key => 
                                variantPropsNormalized[key] === orderedPropsNormalized[key]
                            ) && Object.keys(orderedPropsNormalized).length === Object.keys(variantPropsNormalized).length;

                            if (keysMatch) {
                                console.log(`✅ Variant matched! Current stock: ${variant.stock}`);
                                
                                if (variant.stock >= orderedQuantity) {
                                    variant.stock -= orderedQuantity;
                                    variantFound = true;
                                    console.log(`✅ Stock updated to: ${variant.stock}`);
                                    break;
                                } else {
                                    console.error(`❌ Insufficient stock! Available: ${variant.stock}, Needed: ${orderedQuantity}`);
                                }
                            }
                        }

                        if (!variantFound) {
                            console.error(`❌ No matching variant found for properties:`, variantProps);
                        }
                    } else {
                        // إذا لم يكن لديه متغيرات، تحديث المخزون الرئيسي
                        console.log(`Product has no variants. Current stock: ${product.stock}`);
                        if (product.stock >= orderedQuantity) {
                            product.stock -= orderedQuantity;
                            console.log(`✅ Stock updated to: ${product.stock}`);
                        } else {
                            console.error(`❌ Insufficient stock! Available: ${product.stock}, Needed: ${orderedQuantity}`);
                        }
                    }

                    // حفظ التغييرات
                    await product.save();
                    console.log(`✅ Product saved: ${product.title}`);
                }

                console.log('✅ All inventory updates completed successfully');

            } catch (err) {
                console.error('❌ Order processing error:', err);
                console.error('Error stack:', err.stack);
                return res.status(500).json({ message: 'Error processing order', error: err.message });
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