import * as bcrypt from 'bcrypt';
async function test() {
  const match = await bcrypt.compare('Password123!', '$2b$10$nPkHq4DD83n2Xbrq7i8G8uzRm2iQUmNvy8bc2/FSSKWSxD3yGSUpy');
  console.log('Match:', match);
}
test();
