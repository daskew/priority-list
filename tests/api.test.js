// API Tests for Priority List
// Run with: node tests/api.test.js

const API_BASE = process.env.API_BASE || 'https://priority-list-nine.vercel.app/api';

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  const results = [];
  
  async function test(name, fn) {
    try {
      await fn();
      passed++;
      results.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
    } catch (err) {
      failed++;
      results.push({ name, status: 'FAIL', error: err.message });
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

  console.log('\n🧪 Running Priority List API Tests\n');
  console.log('='.repeat(50));
  
  // Test: GET priorities (should return array)
  await test('GET /api/priorities returns an array', async () => {
    const res = await fetch(`${API_BASE}/priorities`);
    const data = await res.json();
    expect(await res.status).toBe(200);
    expect(Array.isArray(data)).toBeTruthy();
  });

  // Test: POST create priority
  let createdPriorityId = null;
  await test('POST /api/priorities creates a new priority', async () => {
    const res = await fetch(`${API_BASE}/priorities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  // Test: GET single priority
  if (createdPriorityId) {
    await test('GET /api/priorities/:id returns the priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`);
      const data = await res.json();
      expect(await res.status).toBe(200);
      expect(data.id).toBe(createdPriorityId);
    });
  }

  // Test: PUT update priority
  if (createdPriorityId) {
    await test('PUT /api/priorities/:id updates the priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: 'Updated Title',
          notes: 'Updated notes'
        })
      });
      const data = await res.json();
      expect(await res.status).toBe(200);
      expect(data.title).toBe('Updated Title');
    });
  }

  // Test: PATCH reorder priorities
  await test('PATCH /api/priorities/reorder reorders priorities', async () => {
    // Get current priorities
    const getRes = await fetch(`${API_BASE}/priorities`);
    const priorities = await getRes.json();
    
    if (priorities.length >= 2) {
      const ids = priorities.map(p => p.id).reverse(); // Reverse order
      const res = await fetch(`${API_BASE}/priorities/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      expect(await res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toHaveLength(priorities.length);
    }
  });

  // Test: DELETE priority
  if (createdPriorityId) {
    await test('DELETE /api/priorities/:id deletes the priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`, {
        method: 'DELETE'
      });
      expect(await res.status).toBe(204);
    });
  }

  // Test: GET deleted priority returns 404
  if (createdPriorityId) {
    await test('GET /api/priorities/:id returns 404 for deleted priority', async () => {
      const res = await fetch(`${API_BASE}/priorities/${createdPriorityId}`);
      expect(await res.status).toBe(404);
    });
  }

  // Test: POST priority without title fails
  await test('POST /api/priorities without title returns 400', async () => {
    const res = await fetch(`${API_BASE}/priorities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'No title' })
    });
    expect(await res.status).toBe(400);
  });

  // Test: PUT with invalid id returns 404
  await test('PUT /api/priorities/:id with invalid id returns 404', async () => {
    const res = await fetch(`${API_BASE}/priorities/invalid-id-123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' })
    });
    expect(await res.status).toBe(404);
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
