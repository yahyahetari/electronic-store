import mongoose, { model, models, Schema } from "mongoose";

const OrderItemSchema = new Schema({
    productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    properties: { type: Object },
    image: String
});

const OrderSchema = new Schema({
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    address2: { type: String },
    state: { type: String },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    notes: { type: String },
    shippingCost: { type: Number, default: 20 },
    paid: { type: Boolean, default: false },
    paymentId: String,
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'shipped', 'delivered'], 
        default: 'pending' 
    }
}, {
    timestamps: true
});

export const Order = models?.Order || model('Order', OrderSchema);
