// Vercel API route for priorities CRUD
let priorities = [];

export default async function handler(req, res) {
  const { method } = req;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // In-memory store (note: this resets on cold start in serverless)
  // For production, use a database
  
  switch (method) {
    case 'GET':
      // GET /api/priorities - list all
      return res.status(200).json(priorities.sort((a, b) => a.order - b.order));
    
    case 'POST':
      // POST /api/priorities - create
      const { title, notes = '' } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      const newPriority = {
        id: crypto.randomUUID(),
        title,
        notes,
        order: priorities.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      priorities.push(newPriority);
      return res.status(201).json(newPriority);
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
