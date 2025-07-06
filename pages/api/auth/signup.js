import { hash } from 'bcryptjs';
import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // التحقق من وجود المستخدم
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await hash(password, 12);

    // إنشاء مستخدم جديد مع إضافة الصورة الافتراضية
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      image: '/user.jpg' // إضافة اسم الصورة الافتراضية
    });

    res.status(201).json({ success: true, userId: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
