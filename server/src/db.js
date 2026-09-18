import Database from 'better-sqlite3'

const db = new Database('game.db')

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    player1_id TEXT,
    player2_id TEXT,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    current_round INTEGER DEFAULT 1,
    status TEXT DEFAULT 'waiting',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    game_id TEXT,
    round_number INTEGER,
    player1_secret INTEGER,
    player2_secret INTEGER,
    player1_guesses_used INTEGER DEFAULT 0,
    player2_guesses_used INTEGER DEFAULT 0,
    player1_found INTEGER DEFAULT 0,
    player2_found INTEGER DEFAULT 0,
    turn_player_id TEXT,
    status TEXT DEFAULT 'picking',
    winner_id TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS guesses (
    id TEXT PRIMARY KEY,
    round_id TEXT,
    guesser_id TEXT,
    target_player_id TEXT,
    guess_value INTEGER,
    feedback TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    game_id TEXT,
    sender_id TEXT,
    content TEXT,
    type TEXT DEFAULT 'text',
    created_at INTEGER
  );
`)

export default db