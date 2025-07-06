import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    try {
      await connectToDB();

      const searchRegex = new RegExp(q, 'i');

      const results = await Product.find({
        title: searchRegex
      }).select('title').limit(10); // Only fetch titles, limit to 10 results

      res.status(200).json({ results });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'An error occurred while searching' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
