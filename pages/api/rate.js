import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'غير مصرح' });
  }

  try {
    await connectToDB();

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const { productId, ratingId } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'المنتج غير موجود' });
      }

      const ratingIndex = product.ratings.findIndex(
        r => r._id.toString() === ratingId && r.user.email === session.user.email
      );

      if (ratingIndex === -1) {
        return res.status(404).json({ message: 'التعليق غير موجود أو غير مصرح لك بحذفه' });
      }

      product.ratings.splice(ratingIndex, 1);
      await product.save();

      return res.status(200).json({
        message: 'تم حذف التعليق بنجاح',
        updatedRatings: product.ratings
      });
    }

    // Handle PUT request (edit)
    if (req.method === 'PUT') {
      const { productId, ratingId, newRating, newReview } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'المنتج غير موجود' });
      }

      const ratingIndex = product.ratings.findIndex(
        r => r._id.toString() === ratingId && r.user.email === session.user.email
      );

      if (ratingIndex === -1) {
        return res.status(404).json({ message: 'التعليق غير موجود أو غير مصرح لك بتعديله' });
      }

      product.ratings[ratingIndex] = {
        ...product.ratings[ratingIndex].toObject(),
        rating: newRating,
        review: newReview,
        updatedAt: new Date()
      };

      await product.save();

      return res.status(200).json({
        message: 'تم تحديث التعليق بنجاح',
        updatedRatings: product.ratings
      });
    }

    // Handle POST request (create new rating)
    if (req.method === 'POST') {
      const { productId, rating } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'المنتج غير موجود' });
      }

      const userRatingsCount = product.ratings.filter(r => r.user.email === session.user.email).length;

      if (userRatingsCount >= 3) {
        return res.status(403).json({ message: 'لقد وصلت إلى الحد الأقصى المسموح به من التعليقات (3 تعليقات)' });
      }

      const userOrder = await Order.findOne({
        email: session.user.email,
        $or: [
          { 'items.productId': productId },
          { 'items.title': product.title }
        ]
      });

      if (!userOrder) {
        return res.status(403).json({ message: 'لا يمكنك وضع تعليق قبل شراء المنتج' });
      }

      const newRating = {
        ...rating,
        user: {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image
        },
        createdAt: new Date()
      };

      product.ratings.push(newRating);
      await product.save();

      return res.status(200).json({
        message: 'تمت إضافة التقييم بنجاح',
        updatedRatings: product.ratings
      });
    }

    return res.status(405).json({ message: 'الطريقة غير مسموح بها' });

  } catch (error) {
    console.error('خطأ:', error);
    res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
  }
}
