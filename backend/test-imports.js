async function testImports() {
  const modules = ['express', 'cors', 'dotenv', 'jsonwebtoken', 'bcryptjs', 'mongoose'];
  for (const mod of modules) {
    try {
      await import(mod);
      console.log(`✅ ${mod} imported successfully`);
    } catch (err) {
      console.error(`❌ Failed to import ${mod}:`);
      console.error(err);
    }
  }
}
testImports();
