CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  email TEXT,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date TEXT,
  assigned_to INTEGER,
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);