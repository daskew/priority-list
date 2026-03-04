// Vercel API route for reordering priorities with authentication
const prioritiesByUser = {};

function getUserPriorities(userId) {
  if (!prioritiesByUser[userId]) {
    prioritiesByUser[userId] = [];
  }
  return prioritiesByUser[userId];
}

function setUserPriorities(userId, priorities) {
  prioritiesByUser[userId] = priorities;
}

export default async function handler(req, res) {
  const { method } = req;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get user from token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  const userId = authHeader.replace('Bearer ', '');
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const priorities = getUserPriorities(userId);

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
      
      setUserPriorities(userId, reordered);
      return res.status(200).json(reordered.sort((a, b) => a.order - b.order));
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
