const http = require('http');

http.get('http://localhost:3002/api/v1/questions?status=published&grade=4&subjectId=41ffae87-75b0-4358-9639-0f8711691eb1', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('STATUS CODE:', res.statusCode);
    console.log('RESPONSE:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
