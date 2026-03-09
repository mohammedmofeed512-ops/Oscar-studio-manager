import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import twilio from 'twilio';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Twilio client lazily
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

async function sendWhatsAppNotification(message: string) {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_WHATSAPP_NUMBER || !process.env.TWILIO_TO_NUMBER) {
    console.warn('Twilio not configured, skipping WhatsApp notification');
    return;
  }

  try {
    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${process.env.TWILIO_TO_NUMBER}`,
    });
    console.log('WhatsApp notification sent');
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Projects
  app.get('/api/projects', (req, res) => {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY p.id
      ORDER BY p.date DESC
    `);
    const projects = stmt.all();
    res.json(projects);
  });

  app.post('/api/projects', (req, res) => {
    const { title, type, client, status, date, budget, description, created_by, category, partner_id, account_manager_id, partner_policy, partner_package } = req.body;
    const stmt = db.prepare('INSERT INTO projects (title, type, client, status, date, budget, description, created_by, category, partner_id, account_manager_id, partner_policy, partner_package) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, type, client, status || 'pending', date, budget, description, created_by, category || 'piecework', partner_id || null, account_manager_id || null, partner_policy || null, partner_package || null);
    res.json({ id: info.lastInsertRowid });
  });

  app.get('/api/projects/:id', (req, res) => {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = stmt.get(req.params.id);
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  });

  app.put('/api/projects/:id', (req, res) => {
    const { title, type, client, status, date, budget, description, category, partner_id, account_manager_id, partner_policy, partner_package } = req.body;
    const stmt = db.prepare('UPDATE projects SET title = ?, type = ?, client = ?, status = ?, date = ?, budget = ?, description = ?, category = ?, partner_id = ?, account_manager_id = ?, partner_policy = ?, partner_package = ? WHERE id = ?');
    stmt.run(title, type, client, status, date, budget, description, category || 'piecework', partner_id || null, account_manager_id || null, partner_policy || null, partner_package || null, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    try {
      const deleteProject = db.transaction(() => {
        db.prepare('DELETE FROM tasks WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM expenses WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM project_updates WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM project_items WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
      });
      deleteProject();
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  // Project Updates
  app.get('/api/projects/:id/updates', (req, res) => {
    const stmt = db.prepare('SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC');
    const updates = stmt.all(req.params.id);
    res.json(updates);
  });

  app.post('/api/projects/:id/updates', (req, res) => {
    const { content, created_by } = req.body;
    const stmt = db.prepare('INSERT INTO project_updates (project_id, content, created_at, created_by) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.params.id, content, new Date().toISOString(), created_by);
    res.json({ id: info.lastInsertRowid });
  });

  app.get('/api/updates/recent', (req, res) => {
    const stmt = db.prepare(`
      SELECT u.*, p.title as project_title
      FROM project_updates u
      JOIN projects p ON u.project_id = p.id
      ORDER BY u.created_at DESC
      LIMIT 5
    `);
    const updates = stmt.all();
    res.json(updates);
  });

  // Project Items
  app.get('/api/projects/:id/items', (req, res) => {
    const stmt = db.prepare('SELECT * FROM project_items WHERE project_id = ? ORDER BY created_at ASC');
    const items = stmt.all(req.params.id);
    res.json(items);
  });

  app.post('/api/projects/:id/items', (req, res) => {
    const { name, price, is_paid } = req.body;
    const stmt = db.prepare('INSERT INTO project_items (project_id, name, price, is_paid, created_at) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(req.params.id, name, price || 0, is_paid ? 1 : 0, new Date().toISOString());
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/project-items/:id', (req, res) => {
    const { name, price, is_paid } = req.body;
    const stmt = db.prepare('UPDATE project_items SET name = ?, price = ?, is_paid = ? WHERE id = ?');
    stmt.run(name, price, is_paid ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/project-items/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM project_items WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Tasks
  app.get('/api/tasks', (req, res) => {
    const stmt = db.prepare(`
      SELECT tasks.*, projects.title as project_title, projects.partner_id, projects.category as project_category, team.name as assignee_name, supervisor.name as supervisor_name, project_items.name as project_item_name, project_items.price as project_item_price
      FROM tasks 
      LEFT JOIN projects ON tasks.project_id = projects.id
      LEFT JOIN team ON tasks.assigned_to = team.id
      LEFT JOIN team as supervisor ON tasks.supervisor_id = supervisor.id
      LEFT JOIN project_items ON tasks.project_item_id = project_items.id
      ORDER BY tasks.due_date ASC
    `);
    const tasks = stmt.all();
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const { title, project_id, assigned_to, priority, status, due_date, created_by, description, service_name, service_price, content_text, caption, hashtags, publish_accounts, supervisor_id, client_approval, content_type, pieces_count, project_item_id, participating_trainees } = req.body;
    const stmt = db.prepare('INSERT INTO tasks (title, project_id, assigned_to, priority, status, due_date, created_by, description, service_name, service_price, content_text, caption, hashtags, publish_accounts, supervisor_id, client_approval, content_type, pieces_count, project_item_id, participating_trainees) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, project_id || null, assigned_to || null, priority, status || 'todo', due_date, created_by, description, service_name || null, service_price || null, content_text || null, caption || null, hashtags || null, publish_accounts || null, supervisor_id || null, client_approval || 'pending', content_type || null, pieces_count || 1, project_item_id || null, participating_trainees ? JSON.stringify(participating_trainees) : null);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/tasks/:id', (req, res) => {
    const { title, project_id, assigned_to, priority, status, due_date, description, service_name, service_price, content_text, caption, hashtags, publish_accounts, supervisor_id, client_approval, content_type, pieces_count, project_item_id, participating_trainees } = req.body;
    
    const currentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    const stmt = db.prepare('UPDATE tasks SET title = ?, project_id = ?, assigned_to = ?, priority = ?, status = ?, due_date = ?, description = ?, service_name = ?, service_price = ?, content_text = ?, caption = ?, hashtags = ?, publish_accounts = ?, supervisor_id = ?, client_approval = ?, content_type = ?, pieces_count = ?, project_item_id = ?, participating_trainees = ? WHERE id = ?');
    stmt.run(title, project_id || null, assigned_to || null, priority, status, due_date, description, service_name || null, service_price || null, content_text || null, caption || null, hashtags || null, publish_accounts || null, supervisor_id || null, client_approval || 'pending', content_type || null, pieces_count || 1, project_item_id || null, participating_trainees ? JSON.stringify(participating_trainees) : null, req.params.id);
    
    if (currentTask && currentTask.status !== 'done' && status === 'done') {
      sendWhatsAppNotification(`تم إنجاز المهمة: ${title}`);
    }
    
    res.json({ success: true });
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Marketing Strategies
  app.get('/api/projects/:id/marketing-strategies', (req, res) => {
    const stmt = db.prepare('SELECT * FROM marketing_strategies WHERE project_id = ? ORDER BY created_at DESC');
    const strategies = stmt.all(req.params.id);
    res.json(strategies);
  });

  app.post('/api/projects/:id/marketing-strategies', (req, res) => {
    const { title, content } = req.body;
    const stmt = db.prepare('INSERT INTO marketing_strategies (project_id, title, content, created_at) VALUES (?, ?, ?, ?)');
    const info = stmt.run(req.params.id, title, content, new Date().toISOString());
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/marketing-strategies/:id', (req, res) => {
    db.prepare('DELETE FROM marketing_strategies WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Sponsored Ads
  app.get('/api/projects/:id/sponsored-ads', (req, res) => {
    const stmt = db.prepare('SELECT * FROM sponsored_ads WHERE project_id = ? ORDER BY start_date DESC');
    const ads = stmt.all(req.params.id);
    res.json(ads);
  });

  app.post('/api/projects/:id/sponsored-ads', (req, res) => {
    const { platform, budget, start_date, end_date, notes, client_approval } = req.body;
    const stmt = db.prepare('INSERT INTO sponsored_ads (project_id, platform, budget, start_date, end_date, notes, client_approval) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.params.id, platform, budget, start_date, end_date, notes, client_approval || 'pending');
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/sponsored-ads/:id', (req, res) => {
    const { platform, budget, start_date, end_date, notes, client_approval } = req.body;
    const stmt = db.prepare('UPDATE sponsored_ads SET platform = ?, budget = ?, start_date = ?, end_date = ?, notes = ?, client_approval = ? WHERE id = ?');
    stmt.run(platform, budget, start_date, end_date, notes, client_approval || 'pending', req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/sponsored-ads/:id', (req, res) => {
    db.prepare('DELETE FROM sponsored_ads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Reels Schedule
  app.get('/api/projects/:id/reels-schedule', (req, res) => {
    const stmt = db.prepare(`
      SELECT r.*, t.name as assignee_name
      FROM reels_schedule r
      LEFT JOIN team t ON r.assigned_to = t.id
      WHERE r.project_id = ?
      ORDER BY r.publish_date DESC
    `);
    const schedule = stmt.all(req.params.id);
    res.json(schedule);
  });

  app.post('/api/projects/:id/reels-schedule', (req, res) => {
    const { title, shoot_date, publish_date, assigned_to, notes, client_approval } = req.body;
    const stmt = db.prepare('INSERT INTO reels_schedule (project_id, title, shoot_date, publish_date, assigned_to, notes, client_approval) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(req.params.id, title, shoot_date, publish_date, assigned_to, notes, client_approval || 'pending');
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/reels-schedule/:id', (req, res) => {
    const { title, shoot_date, publish_date, assigned_to, notes, status, client_approval } = req.body;
    const stmt = db.prepare('UPDATE reels_schedule SET title = ?, shoot_date = ?, publish_date = ?, assigned_to = ?, notes = ?, status = ?, client_approval = ? WHERE id = ?');
    stmt.run(title, shoot_date, publish_date, assigned_to, notes, status, client_approval || 'pending', req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/reels-schedule/:id', (req, res) => {
    db.prepare('DELETE FROM reels_schedule WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Team
  app.get('/api/team', (req, res) => {
    const stmt = db.prepare(`
      SELECT t.*, 
        AVG(
          (e.attendance_score + e.deadline_score + e.policy_score + 
           e.teamwork_score + e.development_score + e.property_score) / 6.0
        ) as avg_rating
      FROM team t
      LEFT JOIN evaluations e ON t.id = e.employee_id
      GROUP BY t.id
    `);
    const team = stmt.all();
    res.json(team);
  });

  app.get('/api/team-stats', (req, res) => {
    const stmt = db.prepare(`
      SELECT 
        t.id, t.name, t.role, t.type, t.avatar, t.avatar_icon,
        COUNT(DISTINCT tk.id) as total_tasks,
        SUM(CASE WHEN tk.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        COUNT(DISTINCT tk.project_id) as projects_count,
        AVG(
          (e.attendance_score + e.deadline_score + e.policy_score + 
           e.teamwork_score + e.development_score + e.property_score) / 6.0
        ) as avg_rating
      FROM team t
      LEFT JOIN tasks tk ON t.id = tk.assigned_to
      LEFT JOIN evaluations e ON t.id = e.employee_id
      GROUP BY t.id
    `);
    const stats = stmt.all();
    res.json(stats);
  });

  app.post('/api/team', (req, res) => {
    const { name, role, phone, type, password, description, avatar, avatar_icon, contract_type, salary, piece_name, piece_price, services, reward } = req.body;
    const stmt = db.prepare('INSERT INTO team (name, role, phone, type, password, description, avatar, avatar_icon, contract_type, salary, piece_name, piece_price, services, reward) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, role, phone, type || 'member', password || '123456', description, avatar, avatar_icon, contract_type || 'piecework', salary || null, piece_name || null, piece_price || null, services ? JSON.stringify(services) : null, reward || 0);
    res.json({ id: info.lastInsertRowid });
  });

  // Notifications
  app.get('/api/notifications', (req, res) => {
    const { target_group, limit, exclude_user_id } = req.query;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    
    if (target_group) {
      query += " AND (target_group = ? OR target_group = 'all')";
      params.push(target_group);
    }
    
    if (exclude_user_id) {
      query += ' AND (source_id IS NULL OR source_id != ?)';
      params.push(exclude_user_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    } else {
      query += ' LIMIT 5';
    }

    const stmt = db.prepare(query);
    const notifications = stmt.all(...params);
    res.json(notifications);
  });

  app.delete('/api/notifications', (req, res) => {
    try {
      db.prepare('DELETE FROM notifications').run();
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      res.status(500).json({ error: 'Failed to delete notifications' });
    }
  });

  app.put('/api/team/:id', (req, res) => {
    const { name, role, phone, type, password, description, avatar, avatar_icon, contract_type, salary, piece_name, piece_price, services, reward } = req.body;
    
    // Check for reward increase or promotion to create notification
    try {
      const currentMember = db.prepare('SELECT * FROM team WHERE id = ?').get(req.params.id);
      
      if (currentMember) {
        const newReward = parseFloat(reward);
        const oldReward = currentMember.reward || 0;

        // Reward Notification - Only if reward is explicitly provided and different
        if (reward !== undefined && !isNaN(newReward) && newReward !== oldReward) {
          if (newReward > oldReward) {
            const targetGroup = (currentMember.type && currentMember.type.startsWith('trainee')) ? 'trainees' : 'team';
            const message = `حصل زميلكم ${currentMember.name} على مكافأة!`;
            db.prepare('INSERT INTO notifications (type, message, target_group, source_id) VALUES (?, ?, ?, ?)').run('reward', message, targetGroup, req.params.id);
          }
        }

        // Promotion Notification
        if (type && type !== currentMember.type) {
          // Check if it is a promotion (only for trainees or trainee becoming member)
          const isTraineePromotion = 
            (currentMember.type === 'trainee_3' && type === 'trainee_2') ||
            (currentMember.type === 'trainee_2' && type === 'trainee_1') ||
            (currentMember.type === 'trainee_1' && type === 'member');

          if (isTraineePromotion) {
            let newLevelName = '';
            if (type === 'trainee_2') newLevelName = 'المستوى الثاني';
            if (type === 'trainee_1') newLevelName = 'المستوى الأول';
            if (type === 'member') newLevelName = 'فريق العمل';

            const message = `تم ترقية زميلكم ${currentMember.name} إلى ${newLevelName}!`;
            // Target group is trainees to motivate them. If promoted to member, maybe still notify trainees? Yes, "to motivate them"
            const targetGroup = 'trainees'; 
            db.prepare('INSERT INTO notifications (type, message, target_group, source_id) VALUES (?, ?, ?, ?)').run('promotion', message, targetGroup, req.params.id);
          }
        }
      }
    } catch (e) {
      console.error('Error creating notification:', e);
    }

    const stmt = db.prepare('UPDATE team SET name = ?, role = ?, phone = ?, type = ?, password = ?, description = ?, avatar = ?, avatar_icon = ?, contract_type = ?, salary = ?, piece_name = ?, piece_price = ?, services = ?, reward = ? WHERE id = ?');
    stmt.run(name, role, phone, type || 'member', password, description, avatar, avatar_icon, contract_type || 'piecework', salary || null, piece_name || null, piece_price || null, services ? JSON.stringify(services) : null, reward || 0, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/team/:id/reward', (req, res) => {
    const { amount } = req.body;
    try {
      const member = db.prepare('SELECT * FROM team WHERE id = ?').get(req.params.id);
      if (!member) return res.status(404).json({ error: 'Member not found' });

      const rewardAmount = parseFloat(amount);
      if (isNaN(rewardAmount) || rewardAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const newReward = (member.reward || 0) + rewardAmount;
      
      db.prepare('UPDATE team SET reward = ? WHERE id = ?').run(newReward, req.params.id);

      const targetGroup = (member.type && member.type.startsWith('trainee')) ? 'trainees' : 'team';
      const message = `حصل زميلكم ${member.name} على مكافأة!`;
      db.prepare('INSERT INTO notifications (type, message, target_group, source_id) VALUES (?, ?, ?, ?)').run('reward', message, targetGroup, req.params.id);

      res.json({ success: true, new_reward: newReward });
    } catch (e) {
      console.error('Error giving reward:', e);
      res.status(500).json({ error: 'Failed to give reward' });
    }
  });

  // Evaluations
  app.get('/api/evaluations', (req, res) => {
    const stmt = db.prepare(`
      SELECT e.*, t.name as employee_name, ev.name as evaluator_name
      FROM evaluations e
      JOIN team t ON e.employee_id = t.id
      LEFT JOIN team ev ON e.evaluator_id = ev.id
      ORDER BY e.month DESC, e.created_at DESC
    `);
    const evaluations = stmt.all();
    res.json(evaluations);
  });

  app.get('/api/evaluations/:employeeId', (req, res) => {
    const stmt = db.prepare('SELECT * FROM evaluations WHERE employee_id = ? ORDER BY month DESC');
    const evaluations = stmt.all(req.params.employeeId);
    res.json(evaluations);
  });

  app.post('/api/evaluations', (req, res) => {
    const { 
      employee_id, evaluator_id, month, 
      attendance_score, deadline_score, policy_score, 
      teamwork_score, development_score, property_score, 
      notes 
    } = req.body;

    // Check if evaluation already exists for this month
    const existing = db.prepare('SELECT id FROM evaluations WHERE employee_id = ? AND month = ?').get(employee_id, month);
    
    if (existing) {
      const stmt = db.prepare(`
        UPDATE evaluations SET 
          attendance_score = ?, deadline_score = ?, policy_score = ?, 
          teamwork_score = ?, development_score = ?, property_score = ?, 
          notes = ?
        WHERE id = ?
      `);
      stmt.run(
        attendance_score, deadline_score, policy_score, 
        teamwork_score, development_score, property_score, 
        notes, existing.id
      );
      res.json({ id: existing.id, updated: true });
    } else {
      const stmt = db.prepare(`
        INSERT INTO evaluations (
          employee_id, evaluator_id, month, 
          attendance_score, deadline_score, policy_score, 
          teamwork_score, development_score, property_score, 
          notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        employee_id, evaluator_id, month, 
        attendance_score, deadline_score, policy_score, 
        teamwork_score, development_score, property_score, 
        notes, new Date().toISOString()
      );
      res.json({ id: info.lastInsertRowid, created: true });
    }
  });

  // Trainee Evaluations
  app.get('/api/trainee-evaluations', (req, res) => {
    const stmt = db.prepare(`
      SELECT e.*, t.name as trainee_name, ev.name as evaluator_name
      FROM trainee_evaluations e
      JOIN team t ON e.trainee_id = t.id
      LEFT JOIN team ev ON e.evaluator_id = ev.id
      ORDER BY e.month DESC, e.created_at DESC
    `);
    const evaluations = stmt.all();
    res.json(evaluations);
  });

  app.get('/api/trainee-evaluations/:traineeId', (req, res) => {
    const stmt = db.prepare('SELECT * FROM trainee_evaluations WHERE trainee_id = ? ORDER BY month DESC');
    const evaluations = stmt.all(req.params.traineeId);
    res.json(evaluations);
  });

  app.post('/api/trainee-evaluations', (req, res) => {
    const { 
      trainee_id, evaluator_id, month, 
      discipline_score, punctuality_score, technical_score, 
      productivity_score, teamwork_score, belonging_score, 
      notes 
    } = req.body;

    const existing = db.prepare('SELECT id FROM trainee_evaluations WHERE trainee_id = ? AND month = ?').get(trainee_id, month);
    
    if (existing) {
      const stmt = db.prepare(`
        UPDATE trainee_evaluations SET 
          discipline_score = ?, punctuality_score = ?, technical_score = ?, 
          productivity_score = ?, teamwork_score = ?, belonging_score = ?, 
          notes = ?
        WHERE id = ?
      `);
      stmt.run(
        discipline_score, punctuality_score, technical_score, 
        productivity_score, teamwork_score, belonging_score, 
        notes, existing.id
      );
      res.json({ id: existing.id, updated: true });
    } else {
      const stmt = db.prepare(`
        INSERT INTO trainee_evaluations (
          trainee_id, evaluator_id, month, 
          discipline_score, punctuality_score, technical_score, 
          productivity_score, teamwork_score, belonging_score, 
          notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        trainee_id, evaluator_id, month, 
        discipline_score, punctuality_score, technical_score, 
        productivity_score, teamwork_score, belonging_score, 
        notes, new Date().toISOString()
      );
      res.json({ id: info.lastInsertRowid, created: true });
    }
  });

  app.get('/api/team/:id', (req, res) => {
    const stmt = db.prepare('SELECT * FROM team WHERE id = ?');
    const member = stmt.get(req.params.id);
    if (member) {
      res.json(member);
    } else {
      res.status(404).json({ error: 'Member not found' });
    }
  });

  app.post('/api/login', (req, res) => {
    const { username, password, type, id } = req.body;
    
    let user;
    if (type === 'admin') {
      // For admins, we check by name and type='admin'
      const stmt = db.prepare('SELECT * FROM team WHERE name = ? AND type = ?');
      user = stmt.get(username, 'admin');
    } else if (type === 'trainee') {
      // For trainees, we check by ID and ensure type starts with 'trainee_'
      const stmt = db.prepare('SELECT * FROM team WHERE id = ? AND type LIKE ?');
      user = stmt.get(Number(id), 'trainee_%');
    } else if (type === 'partner') {
      // For partners, we check by ID and ensure they are 'partner'
      const stmt = db.prepare('SELECT * FROM team WHERE id = ? AND type = ?');
      user = stmt.get(Number(id), 'partner');
    } else {
      // For team members, we check by ID and ensure they are 'member'
      const stmt = db.prepare('SELECT * FROM team WHERE id = ? AND type = ?');
      user = stmt.get(Number(id), 'member');
    }

    if (user) {
      // Check password
      // If user has no password set (migration), allow login or require setup?
      // Let's assume '123456' default if null, or check exact match if present.
      const dbPass = user.password || '123456';
      
      if (password === dbPass) {
        res.json({ success: true, user: { name: user.name, role: user.role, id: user.id, type: user.type } });
      } else {
        res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
      }
    } else {
      // If admin not found in DB, check hardcoded MANAGERS for backward compatibility or initial setup
      // But we are moving to DB only.
      res.status(404).json({ error: 'المستخدم غير موجود' });
    }
  });

  app.delete('/api/team/:id', (req, res) => {
    try {
      const id = req.params.id;
      db.prepare('DELETE FROM evaluations WHERE employee_id = ?').run(id);
      db.prepare('DELETE FROM trainee_evaluations WHERE trainee_id = ?').run(id);
      db.prepare('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      const stmt = db.prepare('DELETE FROM team WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting team member:', error);
      res.status(500).json({ error: 'Failed to delete team member' });
    }
  });

  // Expenses
  app.get('/api/expenses', (req, res) => {
    const stmt = db.prepare('SELECT * FROM expenses ORDER BY date DESC');
    const expenses = stmt.all();
    res.json(expenses);
  });

  app.post('/api/expenses/record-salaries', (req, res) => {
    const { month, created_by } = req.body;
    
    try {
      const teamStmt = db.prepare('SELECT * FROM team');
      const team = teamStmt.all();
      
      let totalSalaries = 0;
      let recordedCount = 0;
      
      const recordTransaction = db.transaction(() => {
        for (const member of team) {
          let salary = 0;
          if (member.contract_type === 'contract') {
            salary = member.salary || 0;
          } else if (member.contract_type === 'piecework') {
            const tasksStmt = db.prepare(`
              SELECT service_price
              FROM tasks 
              WHERE assigned_to = ? AND status = 'done' AND due_date LIKE ?
            `);
            const tasks = tasksStmt.all(member.id, `${month}%`);
            
            for (const task of tasks) {
              if (task.service_price !== null && task.service_price !== undefined) {
                salary += task.service_price;
              } else {
                salary += (member.piece_price || 0);
              }
            }
          }
          
          if (salary > 0) {
            const title = `راتب ${member.name} - ${month}`;
            
            const checkStmt = db.prepare('SELECT id FROM expenses WHERE title = ? AND category = ?');
            const existing = checkStmt.get(title, 'salaries');
            
            if (!existing) {
              const insertStmt = db.prepare('INSERT INTO expenses (title, amount, category, date, created_by) VALUES (?, ?, ?, ?, ?)');
              const date = new Date().toISOString().split('T')[0];
              insertStmt.run(title, salary, 'salaries', date, created_by);
              totalSalaries += salary;
              recordedCount++;
            }
          }
        }
      });
      
      recordTransaction();
      res.json({ success: true, total: totalSalaries, count: recordedCount });
    } catch (error) {
      console.error('Error recording salaries:', error);
      res.status(500).json({ error: 'Failed to record salaries' });
    }
  });

  app.post('/api/expenses', (req, res) => {
    const { title, amount, category, date, project_id, created_by } = req.body;
    const stmt = db.prepare('INSERT INTO expenses (title, amount, category, date, project_id, created_by) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(title, amount, category, date, project_id || null, created_by);
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/expenses/:id', (req, res) => {
    const { title, amount, category, date, project_id } = req.body;
    const stmt = db.prepare('UPDATE expenses SET title = ?, amount = ?, category = ?, date = ?, project_id = ? WHERE id = ?');
    stmt.run(title, amount, category, date, project_id || null, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/expenses/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Goals
  app.get('/api/goals-history', (req, res) => {
    const stmt = db.prepare('SELECT * FROM goals WHERE saved_at IS NOT NULL ORDER BY month DESC');
    const history = stmt.all();
    res.json(history);
  });

  app.get('/api/goals/:month', (req, res) => {
    const stmt = db.prepare('SELECT * FROM goals WHERE month = ?');
    const goal = stmt.get(req.params.month);
    res.json(goal || {});
  });

  app.get('/api/stats/:month', (req, res) => {
    const month = req.params.month; // YYYY-MM
    
    try {
      const revenueStmt = db.prepare("SELECT SUM(budget) as total FROM projects WHERE date LIKE ? AND category != 'piecework'");
      const fixedRevenue = revenueStmt.get(`${month}%`).total || 0;

      const pieceworkRevenueStmt = db.prepare(`
        SELECT SUM(pi.price * t.pieces_count) as total
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN project_items pi ON t.project_item_id = pi.id
        WHERE p.category = 'piecework' AND t.status = 'done' AND t.due_date LIKE ?
      `);
      const pieceworkRevenue = pieceworkRevenueStmt.get(`${month}%`).total || 0;

      const revenue = fixedRevenue + pieceworkRevenue;

      const expensesStmt = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE date LIKE ?");
      const expenses = expensesStmt.get(`${month}%`).total || 0;

      res.json({
        revenue,
        expenses,
        profit: revenue - expenses
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.post('/api/goals', (req, res) => {
    const { month, revenue_target, target_wedding, target_content, target_commercial, target_charity, actual_revenue, actual_profit, actual_expenses } = req.body;
    
    console.log('Saving goals for month:', month, req.body);

    if (!month) {
      return res.status(400).json({ error: 'Month is required' });
    }

    try {
      const existing = db.prepare('SELECT id FROM goals WHERE month = ?').get(month);
      
      if (existing) {
        // If actuals are provided, update them along with targets
        // If not provided, keep existing values (handled by COALESCE or just not updating if undefined, but here we update all if present)
        
        let updateQuery = `
          UPDATE goals 
          SET revenue_target = COALESCE(?, revenue_target), 
              target_wedding = COALESCE(?, target_wedding), 
              target_content = COALESCE(?, target_content), 
              target_commercial = COALESCE(?, target_commercial), 
              target_charity = COALESCE(?, target_charity)
        `;
        
        const params = [revenue_target, target_wedding, target_content, target_commercial, target_charity];

        if (actual_revenue !== undefined) {
          updateQuery += `, actual_revenue = ?, saved_at = CURRENT_TIMESTAMP`;
          params.push(actual_revenue);
        } else {
           // If not provided in update but we want to ensure it's recorded if it's a "save results" call
           // But the client sends it.
        }
        if (actual_profit !== undefined) {
          updateQuery += `, actual_profit = ?`;
          params.push(actual_profit);
        }
        if (actual_expenses !== undefined) {
          updateQuery += `, actual_expenses = ?`;
          params.push(actual_expenses);
        }

        updateQuery += ` WHERE month = ?`;
        params.push(month);

        const stmt = db.prepare(updateQuery);
        stmt.run(...params);
      } else {
        const stmt = db.prepare(`
          INSERT INTO goals (month, revenue_target, target_wedding, target_content, target_commercial, target_charity, actual_revenue, actual_profit, actual_expenses, saved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Check if actuals are provided to determine if we should set saved_at
        const isSavingResults = actual_revenue !== undefined;
        
        stmt.run(
          month, 
          revenue_target || 0, 
          target_wedding || 0, 
          target_content || 0, 
          target_commercial || 0, 
          target_charity || 0,
          actual_revenue || 0,
          actual_profit || 0,
          actual_expenses || 0,
          isSavingResults ? new Date().toISOString() : null
        );
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving goals:', error);
      res.status(500).json({ error: 'Failed to save goals' });
    }
  });


  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
