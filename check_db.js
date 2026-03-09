import Database from 'better-sqlite3';
const db = new Database('studio.db');
console.log('Team:', db.prepare('SELECT count(*) FROM team').get());
console.log('Projects:', db.prepare('SELECT count(*) FROM projects').get());
console.log('Tasks:', db.prepare('SELECT count(*) FROM tasks').get());
