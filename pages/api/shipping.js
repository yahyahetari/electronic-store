import { connectToDB } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await connectToDB();

  if (req.method === 'GET') {
    try {
      const lastOrder = await Order.findOne({ email: session.user.email }).sort({ createdAt: -1 });
      const shippingInfo = lastOrder ? {
        firstName: lastOrder.firstName,
        lastName: lastOrder.lastName,
        email: lastOrder.email,
        phone: lastOrder.phone,
        address: lastOrder.address,
        address2: lastOrder.address2,
        state: lastOrder.state,
        city: lastOrder.city,
        country: lastOrder.country,
        postalCode: lastOrder.postalCode,
        hasOrder: true
      } : {
        firstName: '', 
        lastName: '', 
        email: session.user.email, 
        phone: '', 
        address: '',
        address2: '', 
        state: '', 
        city: '', 
        country: '', 
        postalCode: '',
        hasOrder: false
      };
      res.status(200).json(shippingInfo);
    } catch (error) {
      console.error('Error fetching shipping data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const lastOrder = await Order.findOne({ email: session.user.email }).sort({ createdAt: -1 });
      if (!lastOrder) {
        return res.status(403).json({ error: 'No previous order found. Cannot update shipping information.' });
      }

      const updatedInfo = req.body;
      console.log("Updating with:", updatedInfo);

      const updatedOrder = await Order.findOneAndUpdate(
        { email: session.user.email },
        { $set: { ...updatedInfo, email: session.user.email } },
        { new: true, sort: { createdAt: -1 } }
      );

      res.status(200).json({ message: 'Shipping information updated successfully', updatedOrder });
    } catch (error) {
      console.error('Error updating shipping data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
