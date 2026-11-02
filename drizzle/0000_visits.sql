CREATE TABLE visits (id TEXT PRIMARY KEY NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE totals (id INTEGER PRIMARY KEY CHECK (id = 1), count INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE TRIGGER visits_increment AFTER INSERT ON visits BEGIN INSERT INTO totals (id, count) VALUES (1, 1) ON CONFLICT (id) DO UPDATE SET count = count + 1; END;
