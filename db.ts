import Database from 'better-sqlite3';

const db = new Database('studio.db');

try {
  db.exec("ALTER TABLE team ADD COLUMN services TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE tasks ADD COLUMN service_name TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE tasks ADD COLUMN service_price REAL;");
} catch (e) {}

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'wedding', 'content', 'commercial', 'charity'
    client TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    date TEXT,
    budget REAL,
    description TEXT,
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    project_id INTEGER,
    assigned_to INTEGER,
    priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
    status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    due_date TEXT,
    created_by TEXT,
    description TEXT,
    service_name TEXT,
    service_price REAL,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    type TEXT DEFAULT 'member', -- 'admin', 'member'
    contract_type TEXT DEFAULT 'piecework', -- 'contract', 'piecework'
    salary REAL,
    piece_name TEXT,
    piece_price REAL,
    services TEXT, -- JSON array of {name, price}
    password TEXT,
    description TEXT,
    avatar TEXT,
    avatar_icon TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date TEXT,
    project_id INTEGER,
    created_by TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT UNIQUE, -- Format: YYYY-MM
    revenue_target REAL DEFAULT 0,
    target_wedding INTEGER DEFAULT 0,
    target_content INTEGER DEFAULT 0,
    target_commercial INTEGER DEFAULT 0,
    target_charity INTEGER DEFAULT 0,
    actual_revenue REAL DEFAULT 0,
    actual_profit REAL DEFAULT 0,
    actual_expenses REAL DEFAULT 0,
    saved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    evaluator_id INTEGER,
    month TEXT NOT NULL, -- Format: YYYY-MM
    attendance_score INTEGER DEFAULT 0,
    deadline_score INTEGER DEFAULT 0,
    policy_score INTEGER DEFAULT 0,
    teamwork_score INTEGER DEFAULT 0,
    development_score INTEGER DEFAULT 0,
    property_score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT,
    FOREIGN KEY(employee_id) REFERENCES team(id)
  );

  CREATE TABLE IF NOT EXISTS trainee_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trainee_id INTEGER NOT NULL,
    evaluator_id INTEGER,
    month TEXT NOT NULL, -- Format: YYYY-MM
    discipline_score INTEGER DEFAULT 0,
    punctuality_score INTEGER DEFAULT 0,
    technical_score INTEGER DEFAULT 0,
    productivity_score INTEGER DEFAULT 0,
    teamwork_score INTEGER DEFAULT 0,
    belonging_score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT,
    FOREIGN KEY(trainee_id) REFERENCES team(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'reward', 'info', etc.
    message TEXT NOT NULL,
    target_group TEXT, -- 'team', 'trainees', 'all'
    source_id INTEGER, -- The user ID who triggered this notification (e.g. received the reward)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS project_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS project_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL DEFAULT 0,
    is_paid INTEGER DEFAULT 0, -- 0 for unpaid, 1 for paid
    created_at TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
`);

// Migrations for existing tables
try { db.exec("ALTER TABLE projects ADD COLUMN created_by TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN category TEXT DEFAULT 'piecework'"); } catch (e) {}
try { db.exec("CREATE TABLE IF NOT EXISTS project_items (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, name TEXT NOT NULL, price REAL DEFAULT 0, is_paid INTEGER DEFAULT 0, created_at TEXT, FOREIGN KEY(project_id) REFERENCES projects(id))"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN payment_status TEXT DEFAULT 'unpaid'"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN created_by TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE expenses ADD COLUMN created_by TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE goals ADD COLUMN actual_revenue REAL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE goals ADD COLUMN actual_profit REAL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE goals ADD COLUMN actual_expenses REAL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE goals ADD COLUMN saved_at TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN description TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN type TEXT DEFAULT 'member'"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN password TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN description TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN avatar TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN avatar_icon TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN contract_type TEXT DEFAULT 'piecework'"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN salary REAL"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN piece_name TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN piece_price REAL"); } catch (e) {}
try { db.exec("ALTER TABLE team ADD COLUMN reward REAL DEFAULT 0"); } catch (e) {}
try { db.exec("CREATE TABLE IF NOT EXISTS project_updates (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT, FOREIGN KEY(project_id) REFERENCES projects(id))"); } catch (e) {}


// Seed initial managers if they don't exist
const managers = ['اسلام مفيد', 'احمد حسن', 'محمد مفيد'];
const checkStmt = db.prepare('SELECT id FROM team WHERE name = ? AND type = ?');
const insertStmt = db.prepare('INSERT INTO team (name, type, password, role) VALUES (?, ?, ?, ?)');

managers.forEach(name => {
  const exists = checkStmt.get(name, 'admin');
  if (!exists) {
    insertStmt.run(name, 'admin', '123456', 'مدير');
  }
});

try { db.exec("ALTER TABLE projects ADD COLUMN partner_id INTEGER"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN content_text TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN caption TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN hashtags TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN publish_accounts TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN supervisor_id INTEGER"); } catch (e) {}

// New tables for partner management
db.exec(`
  CREATE TABLE IF NOT EXISTS marketing_strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS sponsored_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    platform TEXT,
    budget REAL,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS reels_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    shoot_date TEXT,
    publish_date TEXT,
    status TEXT DEFAULT 'planned',
    assigned_to INTEGER,
    notes TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(assigned_to) REFERENCES team(id)
  );
`);

try { db.exec("ALTER TABLE projects ADD COLUMN account_manager_id INTEGER"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN partner_policy TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE projects ADD COLUMN partner_package TEXT"); } catch (e) {}

try { db.exec("ALTER TABLE tasks ADD COLUMN client_approval TEXT DEFAULT 'pending'"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN content_type TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE reels_schedule ADD COLUMN client_approval TEXT DEFAULT 'pending'"); } catch (e) {}
try { db.exec("ALTER TABLE sponsored_ads ADD COLUMN client_approval TEXT DEFAULT 'pending'"); } catch (e) {}

try { db.exec("ALTER TABLE tasks ADD COLUMN pieces_count INTEGER DEFAULT 1"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN project_item_id INTEGER"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN participating_trainees TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE notifications ADD COLUMN source_id INTEGER"); } catch (e) {}

export default db;
