// pages/api/webhook.js (في مشروع المتجر - المنفذ 3002)
import { Order } from "@/models/Order";
import { Product } from "@/models/Products";
import { buffer } from "micro";
import { sendOrderNotifications } from "@/lib/whatsapp-waha";

const stripe = require('stripe')(process.env.STRIPE_SK);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const SHIPPING_COST = 2000;

export default async function handler(req, res) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 WEBHOOK RECEIVED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const buf = await buffer(req);

    let event;
    try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
        console.log('✅ Stripe webhook verified:', event.type);
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;
        const paid = session.payment_status === 'paid';

        console.log('💳 Payment status:', paid ? 'PAID ✅' : 'UNPAID ❌');

        if (paid) {
            try {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📦 PROCESSING ORDER...');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // إعادة بناء بيانات الطلب من metadata
                const orderIds = metadata.orderIds.split(',');
                const quantities = metadata.quantities.split(',').map(Number);
                const prices = metadata.prices.split(',').map(Number);
                const properties = JSON.parse(metadata.properties || '[]');
                
                // تقسيم الاسم بشكل آمن
                const nameParts = metadata.customerName.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                const [email, phone] = metadata.contactInfo.split('|');
                const [address, city, country, postalCode] = metadata.shippingAddress.split('|');
                const address2 = metadata.address2 || '';
                const state = metadata.state || '';

                console.log('Customer:', firstName, lastName);
                console.log('Phone:', phone);
                console.log('Email:', email);
                console.log('Country:', country);

                // جلب تفاصيل المنتجات
                const products = await Product.find({ _id: { $in: orderIds } });
                console.log(`✅ Found ${products.length} products`);

                const orderItems = orderIds.map((id, index) => {
                    const product = products.find(p => p._id.toString() === id);
                    if (!product) {
                        console.error(`❌ Product not found: ${id}`);
                        return null;
                    }
                    return {
                        productId: id,
                        title: product.title,
                        quantity: quantities[index],
                        price: prices[index],
                        properties: properties[index] || {},
                        image: product.images?.[0] || ''
                    };
                }).filter(Boolean);

                const totalAmount = orderItems.reduce((sum, item) => 
                    sum + (item.price * item.quantity), 0) + SHIPPING_COST / 100;

                console.log('💰 Total Amount:', totalAmount, 'ريال');

                // إنشاء الطلب
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

                console.log('✅ Order created:', orderDoc._id.toString());

                // ⭐ إرسال إشعارات WhatsApp
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📱 SENDING WHATSAPP NOTIFICATIONS...');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                try {
                    const notificationResults = await sendOrderNotifications(orderDoc);
                    
                    // تحليل نتائج إشعار العميل
                    if (notificationResults.customer?.success) {
                        console.log('✅ Customer notification: SUCCESS');
                    } else {
                        console.error('❌ Customer notification: FAILED');
                        console.error('   Error:', notificationResults.customer?.error);
                    }
                    
                    // تحليل نتائج إشعارات المسؤولين
                    if (notificationResults.admins && notificationResults.admins.length > 0) {
                        const successCount = notificationResults.admins.filter(a => a.success).length;
                        console.log(`📈 Admin notifications: ${successCount}/${notificationResults.admins.length} sent`);
                        
                        notificationResults.admins.forEach((admin, index) => {
                            if (admin.success) {
                                console.log(`  ✅ Admin ${index + 1}: SUCCESS`);
                            } else {
                                console.error(`  ❌ Admin ${index + 1}: FAILED - ${admin.error}`);
                            }
                        });
                    } else {
                        console.warn('⚠️ No admin phone numbers configured');
                    }
                    
                } catch (notifError) {
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.error('❌ NOTIFICATION ERROR:');
                    console.error('Message:', notifError.message);
                    console.error('Stack:', notifError.stack);
                    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    // لا نوقف العملية - نستمر في تحديث المخزون
                }

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📦 UPDATING INVENTORY...');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // تحديث مخزون المنتجات
                for (let i = 0; i < orderIds.length; i++) {
                    const product = products.find(p => p._id.toString() === orderIds[i]);
                    if (!product) {
                        console.error(`❌ Product not found: ${orderIds[i]}`);
                        continue;
                    }

                    const orderedQuantity = quantities[i];
                    const variantProps = properties[i] || {};

                    console.log(`\n🔍 Processing: ${product.title}`);
                    console.log(`   Ordered quantity: ${orderedQuantity}`);
                    console.log(`   Ordered properties:`, JSON.stringify(variantProps));

                    // إذا كان المنتج يحتوي على متغيرات
                    if (product.variants && product.variants.length > 0) {
                        console.log(`   Product has ${product.variants.length} variants`);
                        
                        let variantFound = false;
                        for (let variant of product.variants) {
                            console.log(`   Checking variant:`, JSON.stringify(variant.properties), `Stock: ${variant.stock}`);
                            
                            // تطبيع الخصائص للمقارنة
                            const variantPropsStr = JSON.stringify(
                                Object.entries(variant.properties || {})
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([k, v]) => [k.trim(), String(v).trim()])
                            );
                            
                            const orderedPropsStr = JSON.stringify(
                                Object.entries(variantProps)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([k, v]) => [k.trim(), String(v).trim()])
                            );
                            
                            if (variantPropsStr === orderedPropsStr) {
                                console.log(`   ✅ VARIANT MATCHED!`);
                                console.log(`   Current stock: ${variant.stock}`);
                                
                                if (variant.stock >= orderedQuantity) {
                                    const oldStock = variant.stock;
                                    variant.stock -= orderedQuantity;
                                    console.log(`   ✅ Stock updated: ${oldStock} → ${variant.stock}`);
                                    variantFound = true;
                                } else {
                                    console.error(`   ❌ Insufficient stock! Available: ${variant.stock}, Needed: ${orderedQuantity}`);
                                }
                                break;
                            }
                        }
                        
                        if (!variantFound) {
                            console.error(`   ❌ No matching variant found!`);
                        }
                    } else {
                        // تحديث المخزون الرئيسي
                        console.log(`   Product has no variants. Current stock: ${product.stock}`);
                        
                        if (product.stock >= orderedQuantity) {
                            const oldStock = product.stock;
                            product.stock -= orderedQuantity;
                            console.log(`   ✅ Stock updated: ${oldStock} → ${product.stock}`);
                        } else {
                            console.error(`   ❌ Insufficient stock! Available: ${product.stock}, Needed: ${orderedQuantity}`);
                        }
                    }

                    try {
                        await product.save();
                        console.log(`   💾 Product saved successfully`);
                    } catch (saveError) {
                        console.error(`   ❌ Failed to save product:`, saveError.message);
                    }
                }

                console.log('\n✅ All inventory updates completed');

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ ORDER PROCESSING COMPLETE!');
                console.log('Order ID:', orderDoc._id.toString());
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                return res.json({ 
                    received: true, 
                    orderId: orderDoc._id.toString(),
                    success: true
                });

            } catch (err) {
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('❌ ORDER PROCESSING ERROR:');
                console.error('Message:', err.message);
                console.error('Stack:', err.stack);
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                return res.status(500).json({ 
                    message: 'Error processing order', 
                    error: err.message
                });
            }
        } else {
            console.log('⚠️ Payment not completed, skipping order creation');
        }
    }

    res.json({ received: true });
}

export const config = {
    api: {
        bodyParser: false,
    },
};