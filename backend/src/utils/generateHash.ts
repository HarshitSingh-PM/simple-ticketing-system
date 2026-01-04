import bcrypt from 'bcrypt';

const generatePasswordHash = async () => {
  const password = 'password';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
};

generatePasswordHash();
