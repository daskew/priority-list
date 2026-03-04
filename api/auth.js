// Vercel API route for authentication
// In production, use a real database and password hashing

let users = [];

export default async function handler(req, res) {
  const { method } = req;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple in-memory user store (resets on cold start)
  // For production: use Vercel KV, Postgres, or external DB
  
  switch (method) {
    case 'POST':
      const { action, email, password, name } = req.body;
      
      if (action === 'register') {
        // Check if user exists
        const existing = users.find(u => u.email === email);
        if (existing) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const newUser = {
          id: crypto.randomUUID(),
          email,
          name,
          // In production: hash the password!
          password,
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return res.status(201).json({ user: userWithoutPassword, token: newUser.id });
      }
      
      if (action === 'login') {
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ user: userWithoutPassword, token: user.id });
      }
      
      return res.status(400).json({ error: 'Invalid action' });
    
    case 'GET':
      // Validate token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      const user = users.find(u => u.id === token);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword });
    
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
