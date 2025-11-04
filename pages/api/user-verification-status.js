// pages/api/user-verification-status.js
import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        isVerified: false 
      });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // البحث عن المستخدم
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    console.log('🔍 Checking user:', email, 'Found:', !!user, 'isVerified:', user?.isVerified);
    
    if (!user) {
      return res.status(200).json({ 
        isVerified: false,
        message: 'User not found'
      });
    }

    // إرجاع حالة التحقق
    return res.status(200).json({ 
      isVerified: user.isVerified === true,
      email: user.email
    });

  } catch (error) {
    console.error('❌ Error in user-verification-status:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      isVerified: false 
    });
  }
}