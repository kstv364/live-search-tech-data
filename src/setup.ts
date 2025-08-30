// src/setup.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

// --- Fix __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Resolve paths ---
const dataDir = path.join(__dirname, "../data_model");
const dbPath = path.join(dataDir, "builtwith.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// --- Step 1: Drop old schema if exists ---
db.exec(`
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS technology;
DROP TABLE IF EXISTS company_tech;
DROP TABLE IF EXISTS company_tech_rollup_stats;
DROP TABLE IF EXISTS technology_fts;
DROP VIEW IF EXISTS v_company_tech;
`);

// --- Step 2: Create core tables ---
db.exec(`
CREATE TABLE company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  root_domain TEXT UNIQUE NOT NULL,
  name TEXT,
  category TEXT,
  country TEXT,
  spend INTEGER,
  first_indexed DATE,
  last_indexed DATE
);

CREATE TABLE technology (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  parent_name TEXT,
  premium TEXT,
  description TEXT,
  category TEXT,
  first_added DATE
);

CREATE TABLE company_tech (
  company_id INTEGER NOT NULL,
  tech_id INTEGER NOT NULL,
  first_detected DATE,
  last_detected DATE,
  FOREIGN KEY(company_id) REFERENCES company(id),
  FOREIGN KEY(tech_id) REFERENCES technology(id)
);

CREATE TABLE company_tech_rollup_stats (
  company_id INTEGER NOT NULL,
  parent_tech_id INTEGER NOT NULL,
  child_count INTEGER NOT NULL,
  FOREIGN KEY(company_id) REFERENCES company(id),
  FOREIGN KEY(parent_tech_id) REFERENCES technology(id)
);

CREATE VIRTUAL TABLE technology_fts USING fts5(name, category, content='technology', content_rowid='id');
`);

// --- Step 3: Load JSON files ---
const techIndex = JSON.parse(
  fs.readFileSync(path.join(dataDir, "techIndex.sample.json"), "utf-8")
);

console.log(`Loaded ${techIndex.length} technologies from techIndex.sample.json`);


const metaData = fs
  .readFileSync(path.join(dataDir, "metaData.sample.jsonl"), "utf16le")
  .trim()
  .split("\n")
  .map(line => JSON.parse(line));
console.log(`Loaded ${metaData.length} companies from metaData.sample.jsonl`);
const techData = fs
  .readFileSync(path.join(dataDir, "techData.sample.jsonl"), "utf16le")
  .trim()
  .split("\n")
  .map(line => JSON.parse(line));

console.log(`Loaded ${techIndex.length} technologies, ${metaData.length} companies, ${techData.length} company tech mappings`);

// --- Step 4: Insert into technology ---
const insertTech = db.prepare(`
  INSERT OR IGNORE INTO technology (name, parent_name, premium, description, category, first_added)
  VALUES (?, ?, ?, ?, ?, ?)
`);
db.transaction(() => {
  for (const t of techIndex) {
    if (!t.Name) {
      console.warn("⚠️ Skipping technology missing required Name:", t);
      continue;
    }
    insertTech.run(
      t.Name,
      t.Parent || null,
      t.Premium || null,
      t.Description || null,
      t.Category || null,
      t.FirstAdded || null
    );
  }
})();

// Populate FTS index
db.exec(`INSERT INTO technology_fts (rowid, name, category)
         SELECT id, name, category FROM technology;`);

// --- Step 5: Insert into company (from metaData.jsonl) ---
const insertCompany = db.prepare(`
  INSERT OR IGNORE INTO company (root_domain, name, category, country, spend, first_indexed, last_indexed)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
db.transaction(() => {
  for (const c of metaData) {
    if (!c.D) {
      console.warn("⚠️ Skipping company missing required domain (D):", c);
      continue;
    }
    insertCompany.run(
      c.D,
      c.CN || null,
      c.C || null,
      c.CO || null,
      c.SP ?? null,
      c.FI || null,
      c.LI || null
    );
  }
})();

// --- Step 6: Build ID maps ---
const companyIdByDomain = new Map<string, number>();
for (const row of db.prepare("SELECT id, root_domain FROM company").all()) {
  companyIdByDomain.set(row.root_domain, row.id);
}
const techIdByName = new Map<string, number>();
for (const row of db.prepare("SELECT id, name FROM technology").all()) {
  techIdByName.set(row.name, row.id);
}

// --- Step 7: Insert company_tech (from techData.jsonl) ---
const insertCompanyTech = db.prepare(`
  INSERT INTO company_tech (company_id, tech_id, first_detected, last_detected)
  VALUES (?, ?, ?, ?)
`);
db.transaction(() => {
  for (const c of techData) {
    if (!c.D) {
      console.warn("⚠️ Skipping company_tech missing required domain (D):", c);
      continue;
    }
    const companyId = companyIdByDomain.get(c.D);
    if (!companyId) continue;

    for (const t of c.T || []) {
      if (!t.N) {
        console.warn(`⚠️ Skipping tech record missing required name (N) for company ${c.D}`);
        continue;
      }
      const techId = techIdByName.get(t.N);
      if (techId) {
        insertCompanyTech.run(companyId, techId, t.FD || null, t.LD || null);
      }
    }
  }
})();

// --- Step 8: Compute rollup stats ---
const insertRollup = db.prepare(`
  INSERT INTO company_tech_rollup_stats (company_id, parent_tech_id, child_count)
  VALUES (?, ?, ?)
`);
db.transaction(() => {
  db.exec("DELETE FROM company_tech_rollup_stats");
  const parents = db.prepare(
    `SELECT DISTINCT parent_name FROM technology WHERE parent_name IS NOT NULL`
  ).all();
  for (const [domain, companyId] of companyIdByDomain.entries()) {
    for (const p of parents) {
      const childCount = db
        .prepare(
          `
        SELECT COUNT(*) as cnt
        FROM company_tech ct
        JOIN technology t ON ct.tech_id = t.id
        WHERE ct.company_id = ? AND t.parent_name = ?
      `
        )
        .get(companyId, p.parent_name).cnt as number;
      if (childCount > 0) {
        const parentId = techIdByName.get(p.parent_name);
        if (parentId) insertRollup.run(companyId, parentId, childCount);
      }
    }
  }
})();

// --- Step 9: Create flat view for search ---
db.exec(`
CREATE VIEW v_company_tech AS
SELECT
  c.id as company_id,
  c.root_domain,
  c.name as company_name,
  c.category as company_category,
  c.country,
  c.spend,
  c.first_indexed,
  c.last_indexed,
  t.id as tech_id,
  t.name as tech_name,
  t.category as tech_category,
  t.parent_name,
  ct.first_detected,
  ct.last_detected
FROM company c
JOIN company_tech ct ON c.id = ct.company_id
JOIN technology t ON t.id = ct.tech_id;
`);

// --- Step 10: Indexes ---
db.exec(`
CREATE INDEX idx_company_domain ON company(root_domain);
CREATE INDEX idx_company_country ON company(country);
CREATE INDEX idx_companytech_company ON company_tech(company_id);
CREATE INDEX idx_companytech_tech ON company_tech(tech_id);
CREATE INDEX idx_rollup_company ON company_tech_rollup_stats(company_id);
CREATE INDEX idx_rollup_parent ON company_tech_rollup_stats(parent_tech_id);
`);

console.log(`✅ Database built at ${dbPath}`);
