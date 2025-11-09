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

    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    return res.status(200).json({ exists: !!user });
  } catch (error) {
    console.error('Error checking user existence:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}