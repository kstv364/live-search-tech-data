// src/setup.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

interface TechnologyData {
  Name: string;
  Parent: string | null;
  Premium: string;
  Description: string;
  Category: string;
  FirstAdded: string;
}

interface CompanyRawData {
  D: string; // root_domain
  SP: number; // spend
  FI: string; // first_indexed
  LI: string; // last_indexed
  T: {
    N: string; // tech_name
    FD: string; // first_detected
    LD: string; // last_detected
  }[];
}

interface MetaDataRaw {
  D: string; // root_domain
  CN: string; // company_name
  C: string; // category
  CO: string; // country
  SP: number; // spend
  FI: string; // first_indexed
  LI: string; // last_indexed
}

interface CompanyRow {
  id: number;
  root_domain: string;
}

interface TechnologyRow {
  id?: number;
  name: string;
}

interface ParentTechnologyRow {
  parent_name: string;
}

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
  root_domain TEXT UNIQUE,
  name TEXT,
  category TEXT,
  country TEXT,
  spend INTEGER,
  first_indexed DATE,
  last_indexed DATE
);

CREATE TABLE technology (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  parent_name TEXT,
  premium TEXT,
  description TEXT,
  category TEXT,
  first_added DATE
);

CREATE TABLE company_tech (
  company_id INTEGER,
  tech_id INTEGER,
  first_detected DATE,
  last_detected DATE,
  FOREIGN KEY(company_id) REFERENCES company(id),
  FOREIGN KEY(tech_id) REFERENCES technology(id)
);

CREATE TABLE company_tech_rollup_stats (
  company_id INTEGER,
  parent_tech_id INTEGER,
  child_count INTEGER,
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
  .readFileSync(path.join(dataDir, "metaData.sample.jsonl"), "utf16le") // Changed to 'utf16le'
  .trim()
  .split("\n")
  .map(line => {
    try {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null; // Skip empty lines
      return JSON.parse(trimmedLine);
    } catch (e) {
      console.error("Failed to parse line:", line, e);
      return null; // Skip malformed lines
    }
  })
  .filter(line => line !== null) as MetaDataRaw[]; // Filter out nulls

console.log(`Loaded ${metaData.length} companies from metaData.sample.jsonl`);
const techData = fs
  .readFileSync(path.join(dataDir, "techData.sample.jsonl"), "utf16le") // Changed to 'utf16le'
  .trim()
  .split("\n")
  .map(line => {
    try {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null; // Skip empty lines
      return JSON.parse(trimmedLine);
    } catch (e) {
      console.error("Failed to parse line:", line, e);
      return null; // Skip malformed lines
    }
  })
  .filter(line => line !== null) as CompanyRawData[]; // Filter out nulls
console.log(`Loaded ${techData.length} companies from techData.sample.jsonl`);
// --- Step 4: Insert into technology ---
const insertTech = db.prepare(`
  INSERT OR IGNORE INTO technology (name, parent_name, premium, description, category, first_added)
  VALUES (@Name, @Parent, @Premium, @Description, @Category, @FirstAdded)
`);
db.transaction(() => {
  for (const t of techIndex) insertTech.run(t);
})();

db.exec(`INSERT INTO technology_fts (rowid, name, category)
         SELECT id, name, category FROM technology;`);

// --- Step 5: Insert into company (from metaData.jsonl) ---
const insertCompany = db.prepare(`
  INSERT OR IGNORE INTO company (root_domain, name, category, country, spend, first_indexed, last_indexed)
  VALUES (@D, @CN, @C, @CO, @SP, @FI, @LI)
`);
db.transaction(() => {
  for (const c of metaData){
    console.log(c);
    insertCompany.run(c);
  }
})();

// --- Step 6: Build ID maps ---
const companyIdByDomain = new Map<string, number>();
for (const row of db.prepare("SELECT id, root_domain FROM company").all() as CompanyRow[]) {
  companyIdByDomain.set(row.root_domain, row.id);
}
const techIdByName = new Map<string, number>();
for (const row of db.prepare("SELECT id, name FROM technology").all() as TechnologyRow[]) {
  techIdByName.set(row.name, row.id);
}

// --- Step 7: Insert company_tech (from techData.jsonl) ---
const insertCompanyTech = db.prepare(`
  INSERT INTO company_tech (company_id, tech_id, first_detected, last_detected)
  VALUES (?, ?, ?, ?)
`);
db.transaction(() => {
  for (const c of techData) {
    const companyId = companyIdByDomain.get(c.D);
      if (!companyId) continue;
      for (const t of c.T) {
        const techId = techIdByName.get(t.N);
        if (techId) insertCompanyTech.run(companyId, techId!, t.FD, t.LD);
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
  ).all() as ParentTechnologyRow[];
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
        .get(companyId, p.parent_name) as { cnt: number };
      if (childCount.cnt > 0) {
        const parentId = techIdByName.get(p.parent_name);
        if (parentId) insertRollup.run(companyId, parentId!, childCount.cnt);
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
