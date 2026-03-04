// Vercel API route for single priority CRUD
let priorities = [];

export default async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  const index = priorities.findIndex(p => p.id === id);

  switch (method) {
    case 'GET':
      // GET /api/priorities/[id] - get single
      if (index === -1) {
        return res.status(404).json({ error: 'Priority not found' });
      }
      return res.status(200).json(priorities[index]);
    
    case 'PUT':
      // PUT /api/priorities/[id] - update
      if (index === -1) {
        return res.status(404).json({ error: 'Priority not found' });
      }
      
      const { title, notes, order } = req.body;
      priorities[index] = {
        ...priorities[index],
        ...(title !== undefined && { title }),
        ...(notes !== undefined && { notes }),
        ...(order !== undefined && { order }),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json(priorities[index]);
    
    case 'DELETE':
      // DELETE /api/priorities/[id] - delete
      if (index === -1) {
        return res.status(404).json({ error: 'Priority not found' });
      }
      
      priorities.splice(index, 1);
      // Reorder remaining
      priorities = priorities.map((p, i) => ({ ...p, order: i }));
      
      return res.status(204).end();
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
