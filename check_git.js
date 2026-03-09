import { execSync } from 'child_process';
try {
  console.log(execSync('git status').toString());
  console.log('---');
  console.log(execSync('git log -n 5 --oneline').toString());
} catch (e) {
  console.log(e.message);
}
