const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sheets',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response length:', data.length);
    if (data.length < 1000) {
      console.log('Response:', data);
    } else {
      console.log('First 500 chars:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();