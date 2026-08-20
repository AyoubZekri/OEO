const https = require('http');

https.get('http://backand.kaidoeo.com/api/transactions', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', err => {
  console.log("Error: " + err.message);
});
