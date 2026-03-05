// Vercel API route for authentication with Supabase
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ztoiuatbnlrfhgxnfipc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_3Xb5oMlfhUBuYjdSEKugCw_1cEBH9hT';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple hash using SHA-256 with salt
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, salt, hash) {
  return hashPassword(password, salt) === hash;
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const method = req.method;
  
  if (method !== 'POST' && method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body for POST
  let body = {};
  if (method === 'POST') {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  try {
    if (method === 'POST') {
      const { action, email, password, name } = body;
      
      if (action === 'register') {
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const { data: existing, error: existingError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', email)
          .single();
        
        if (existing) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password with salt
        const salt = generateSalt();
        const passwordHash = hashPassword(password, salt);
        
        // Create user
        const { data: user, error } = await supabase
          .from('users')
          .insert({
            email,
            name,
            password_hash: salt + ':' + passwordHash
          })
          .select()
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(201).json({ 
          user: { id: user.id, email: user.email, name: user.name },
          token: user.id 
        });
      }
      
      if (action === 'login') {
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, password_hash')
          .eq('email', email)
          .single();
        
        if (error || !user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Verify password
        const [salt, storedHash] = user.password_hash.split(':');
        const valid = verifyPassword(password, salt, storedHash);
        
        if (!valid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        return res.status(200).json({ 
          user: { id: user.id, email: user.email, name: user.name },
          token: user.id 
        });
      }
      
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    if (method === 'GET') {
      // Validate token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', token)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      return res.status(200).json({ user });
    }
    
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: err.message });
  }
}
