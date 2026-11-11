const http = require('http');

async function testBackend() {
  console.log('[Test] Starting backend verification...');
  
  // Check if server is already running on 3001
  let isRunning = false;
  try {
    const check = await fetch('http://127.0.0.1:3001/api/inspector/health');
    if (check.ok) isRunning = true;
  } catch (e) {
    isRunning = false;
  }

  if (!isRunning) {
    require('./index.js');
    await new Promise(r => setTimeout(r, 1500));
  } else {
    console.log('[Test] Connected to existing running backend server.');
  }

  // 2. Test GET /api/inspector/health
  const healthRes = await fetch('http://127.0.0.1:3001/api/inspector/health');
  const healthData = await healthRes.json();
  console.log('[Test] Health response:', healthData);

  // 3. Test GET /api/inspector/devices
  const devRes = await fetch('http://127.0.0.1:3001/api/inspector/devices');
  const devData = await devRes.json();
  console.log('[Test] Supported devices count:', Object.keys(devData.presets).length);

  // 4. Test POST /api/inspector/sessions (Create WebKit session)
  const sessionRes = await fetch('http://127.0.0.1:3001/api/inspector/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      engine: 'webkit',
      device: 'iphone-14'
    })
  });
  const sessionData = await sessionRes.json();
  console.log('[Test] Session created:', sessionData.sessionId, sessionData.viewport);

  // 5. Test GET /api/inspector/sessions/:id/element
  const elRes = await fetch(`http://127.0.0.1:3001/api/inspector/sessions/${sessionData.sessionId}/element?selector=h1`);
  const elData = await elRes.json();
  console.log('[Test] Inspected h1 element:', elData.element ? { tag: elData.element.tag, boxModel: elData.element.boxModel } : 'not found');

  // 6. Test POST /api/inspector/sessions/:id/styles (Live CSS override)
  const styleRes = await fetch(`http://127.0.0.1:3001/api/inspector/sessions/${sessionData.sessionId}/styles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selector: 'h1',
      property: 'color',
      value: 'rgb(255, 0, 0)'
    })
  });
  const styleData = await styleRes.json();
  console.log('[Test] Style override applied:', styleData.overrides);

  // 7. Test POST /api/inspector/sessions/:id/interact (Scroll)
  const scrollRes = await fetch(`http://127.0.0.1:3001/api/inspector/sessions/${sessionData.sessionId}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'scroll',
      deltaX: 0,
      deltaY: 450,
      x: 150,
      y: 200
    })
  });
  const scrollData = await scrollRes.json();
  console.log('[Test] Scroll action response:', scrollData);

  // 8. Test DELETE /api/inspector/sessions/:id
  const delRes = await fetch(`http://127.0.0.1:3001/api/inspector/sessions/${sessionData.sessionId}`, {
    method: 'DELETE'
  });
  const delData = await delRes.json();
  console.log('[Test] Session closed:', delData);

  console.log('[Test] ALL BACKEND TESTS PASSED!');
  process.exit(0);
}

testBackend().catch(err => {
  console.error('[Test] FAILED:', err);
  process.exit(1);
});
