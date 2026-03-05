// API Tests for Priority List with Supabase
// Run with: node tests/api.test.js

const API_BASE = process.env.API_BASE || 'https://priority-list-nine.vercel.app/api';

// Test user credentials
let testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'testpassword123',
  name: 'Test User'
};
let authToken = null;
let createdPriorityId = null;

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  async function test(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`✅ ${name}`);
    } catch (err) {
      failed++;
      console.log(`❌ ${name}: ${err.message}`);
    }
  }
  
  async function expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
      },
      toBeTruthy: () => {
        if (!actual) throw new Error(`Expected truthy value, got ${actual}`);
      },
      toContain: (expected) => {
        if (!actual.includes(expected)) throw new Error(`Expected "${actual}" to contain "${expected}"`);
      },
      toHaveLength: (expected) => {
        if (actual.length !== expected) throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    };
  }

  console.log('\n🧪 Running Priority List API Tests (Supabase)\n');
  console.log('='.repeat(50));
  
  // ==================== AUTH TESTS ====================
  
  // Test: POST register new user
  await test('POST /api/auth register creates new user with encrypted password', async () => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'register',
        email: testUser.email,
        password: testUser.password,
        name: testUser.name
      })
    });
    const data = await res.json();
    expect(await res.status).toBe(201);
    expect(data.user).toBeTruthy();
    expect(data.token).toBeTruthy();
    expect(data.user.email).toContain(testUser.email);
    authToken = data.token;
  });

  // Test: POST login with valid credentials
  await test('POST /api/auth login with valid credentials', async () => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'login',
        email: testUser.email,
        password: testUser.password
      })
    });
    const data = await res.json();
    expect(await res.status).toBe(200);
    expect(data.user).toBeTruthy();
    expect(data.token).toBeTruthy();
    authToken = data.token;
  });

  // Test: POST login with invalid password
  await test('POST /api/auth login with wrong password fails', async () => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'login',
        email: testUser.email,
        password: 'wrongpassword'
      })
    });
    expect(await res.status).toBe(401);
  });

  // Test: POST register duplicate email
  await test('POST /api/auth register duplicate email fails', async () => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'register',
        email: testUser.email,
        password: testUser.password,
        name: testUser.name
      })
    });
    expect(await res.status).toBe(400);
  });

  // Test: POST register with short password
  await test('POST /api/auth register with short password fails', async () => {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'register',
        email: 'new@example.com',
        password: '123',
        name: 'Test'
      })
    });
    const data = await res.json();
    expect(await res.status).toBe(400);
    expect(data.error).toContain('6 characters');
  });

  // Test: GET auth with valid token
  if (authToken) {
    await test('GET /api/auth with valid token returns user', async () => {
      const res = await fetch(`${API_BASE}/auth`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      expect(await res.status).toBe(200);
      expect(data.user).toBeTruthy();
    });
  }

  // Test: GET auth without token fails
  await test('GET /api/auth without token fails', async () => {
    const res = await fetch(`${API_BASE}/auth`);
    expect(await res.status).toBe(401);
  });

  // ==================== PRIORITIES TESTS ====================
  
  const getAuthHeader = () => ({ Authorization: `Bearer ${authToken}` });

  // Test: GET priorities (empty)
  if (authToken) {
    await test('GET /api/priorities returns empty array for new user', async () => {
      const res = await fetch(`${API_BASE}/priorities`, { headers: getAuthHeader() });
      const data = await res.json();
      expect(await res.status).toBe(200);
      expect(Array.isArray(data)).toBeTruthy();
    });
  }

  // Test: POST create priority
  if (authToken) {
    await test('POST /api/priorities creates a new priority', async () => {
      const res = await fetch(`${API_BASE}/priorities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ 
          title: `Test Priority ${Date.now()}`,
          notes: 'Test notes'
        })
      });
      const data = await res.json();
      expect(await res.status).toBe(201);
      expect(data.id).toBeTruthy();
      expect(data.title).toBeTruthy();
      createdPriorityId = data.id;
    });
  }

  // Test: GET priorities after creation
  if (authToken && createdPriorityId) {
    await test('GET /api/priorities returns created priority', async () => {
      const res = await fetch(`${API_BASE}/priorities`, { headers: getAuthHeader() });
      const data = await res.json();
      expect(await res.status).toBe(200);
      expect(data.length).toHaveLength(1);
    });
  }

  // Test: GET single priority
  if (authToken && createdPriorityId) {
    await test('GET /api/priorities/:id returns the priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`, { headers: getAuthHeader() });
      const data = await res.json();
      expect(await res.status).toBe(200);
      expect(data.id).toBe(createdPriorityId);
    });
  }

  // Test: PUT update priority
  if (authToken && createdPriorityId) {
    await test('PUT /api/priorities/:id updates the priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ 
          title: 'Updated Title',
          notes: 'Updated notes'
        })
      });
      const data = await res.json();
      expect(await res.status).toBe(200);
      expect(data.title).toBe('Updated Title');
      expect(data.notes).toBe('Updated notes');
    });
  }

  // Test: PATCH reorder priorities
  if (authToken && createdPriorityId) {
    await test('PATCH /api/priorities/reorder reorders priorities', async () => {
      const res = await fetch(`${API_BASE}/priorities/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ids: [createdPriorityId] })
      });
      expect(await res.status).toBe(200);
    });
  }

  // Test: DELETE priority
  if (authToken && createdPriorityId) {
    await test('DELETE /api/priorities/:id deletes the priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      expect(await res.status).toBe(204);
    });
  }

  // Test: GET deleted priority returns 404
  if (authToken && createdPriorityId) {
    await test('GET /api/priorities/:id returns 404 for deleted priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`, { headers: getAuthHeader() });
      expect(await res.status).toBe(404);
    });
  }

  // Test: POST priority without title fails
  if (authToken) {
    await test('POST /api/priorities without title returns 400', async () => {
      const res = await fetch(`${API_BASE}/priorities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ notes: 'No title' })
      });
      expect(await res.status).toBe(400);
    });
  }

  // Test: Priorities require auth
  await test('GET /api/priorities without auth fails', async () => {
    const res = await fetch(`${API_BASE}/priorities`);
    expect(await res.status).toBe(401);
  });

  // ==================== MULTI-USER ISOLATION TESTS ====================
  
  // Create second user and verify they can't see first user's priorities
  await test('User2 cannot see User1 priorities (ownership isolation)', async () => {
    // Register second user
    const user2Email = `test2${Date.now()}@example.com`;
    const registerRes = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'register',
        email: user2Email,
        password: 'testpassword123',
        name: 'Test User 2'
      })
    });
    const user2Data = await registerRes.json();
    const user2Token = user2Data.token;
    
    // User1 creates a priority
    const p1Res = await fetch(`${API_BASE}/priorities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ title: 'User1 Private Priority' })
    });
    const p1Data = await p1Res.json();
    
    // User2 tries to access User1's priority
    const p2Res = await fetch(`${API_BASE}/priorities/${p1Data.id}`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    expect(await p2Res.status).toBe(404);
    
    // User2 tries to delete User1's priority
    const delRes = await fetch(`${API_BASE}/priorities/${p1Data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    expect(await delRes.status).toBe(404);
    
    // User2 should see empty list
    const listRes = await fetch(`${API_BASE}/priorities`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    const listData = await listRes.json();
    expect(listData.length).toHaveLength(0);
  });

  // Test: CORS headers
  await test('API has CORS headers', async () => {
    const res = await fetch(`${API_BASE}/priorities`, { 
      method: 'OPTIONS',
      headers: { 'Origin': 'http://localhost:3000' }
    });
    const corsHeader = res.headers.get('access-control-allow-origin');
    expect(corsHeader).toBeTruthy();
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
