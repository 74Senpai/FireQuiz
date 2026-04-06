import http from 'http';

http.get('http://localhost:8080/api/quiz/public/open', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('--- API /api/quiz/public/open ---');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Error parsing response:', data);
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
