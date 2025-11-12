import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // البحث عن المستخدم بالبريد الإلكتروني (case-insensitive)
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase().trim() 
    });

    console.log('🔍 [API] Checking user:', email);
    console.log('👤 [API] User found:', !!user);
    console.log('✓ [API] Is verified:', user?.isVerified);

    // إذا لم يوجد المستخدم
    if (!user) {
      console.log('❌ [API] User not found, returning exists: false');
      return res.status(200).json({ 
        exists: false,
        isVerified: false 
      });
    }

    // إذا وجد المستخدم، أعد حالته
    console.log('✅ [API] User found, returning exists: true');
    return res.status(200).json({ 
      exists: true,  // ✅ هذا هو الخط المهم!
      isVerified: user.isVerified === true,
      email: user.email,
      name: user.name
    });

  } catch (error) {
    console.error('❌ [API] Error checking user:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      exists: false,
      isVerified: false 
    });
  }
}