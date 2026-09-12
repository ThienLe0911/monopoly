import fs from 'fs';
import path from 'path';
import './packages/engine/tests/vitest-shim.ts';

function findTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findTestFiles(fullPath));
    } else if (file.endsWith('.test.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const testFiles = findTestFiles(path.resolve('./packages'));
console.log(`Found ${testFiles.length} test files to run:\n`);

for (const file of testFiles) {
  console.log(`Running test: ${file}`);
  await import(`file://${file}`);
}
