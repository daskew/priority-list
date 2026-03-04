// Vercel API route for reordering priorities
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

  switch (method) {
    case 'PATCH':
      // PATCH /api/priorities/reorder - reorder
      const { ids } = req.body;
      
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids array is required' });
      }
      
      const reordered = ids.map((id, index) => {
        const priority = priorities.find(p => p.id === id);
        if (priority) {
          return { ...priority, order: index, updatedAt: new Date().toISOString() };
        }
        return null;
      }).filter(Boolean);
      
      priorities = reordered;
      return res.status(200).json(priorities.sort((a, b) => a.order - b.order));
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
