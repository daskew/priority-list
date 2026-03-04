// Vercel API route for priorities CRUD with user authentication
// Each user has their own priorities

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
    case 'GET':
      // GET /api/priorities - list all for user
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
      setUserPriorities(userId, priorities);
      
      return res.status(201).json(newPriority);
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
