const axios = require('axios');
const fs = require('fs');

async function test() {
  try {
    const token = fs.existsSync('localStorage_token.txt') ? fs.readFileSync('localStorage_token.txt', 'utf8').trim() : '';
    console.log("Token:", token.substring(0, 10));
    if (!token) return;
    const res = await axios.get('https://backand.kaidoeo.com/api/matches', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log(JSON.stringify(res.data.data[0], null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
