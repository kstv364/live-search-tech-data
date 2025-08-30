// src/setup.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

// --- ESM __dirname fix ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Paths ---
const dataDir = path.join(__dirname, "../data_model");
const dbPath = path.join(dataDir, "builtwith.db");

// --- Open DB ---
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Helper: parse JSONL using simple readFileSync + split (utf16le for your files)
function parseJsonlLines(filePath: string, encoding = "utf16le"): any[] {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file ${filePath}`);
  const raw = fs.readFileSync(filePath, encoding);
  // strip BOM if present
  const noBom = raw.replace(/^\uFEFF/, "");
  const lines = noBom.split(/\r?\n/);
  const items: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      items.push(JSON.parse(line));
    } catch (err) {
      console.warn(`⚠️ Skipping invalid JSON on line ${i + 1} of ${path.basename(filePath)}:`, err);
      continue;
    }
  }
  return items;
}

// Main
(function main() {
  try {
    // --- Safety: disable foreign keys while dropping/creating schema to avoid DROP-time FK issues ---
    db.pragma("foreign_keys = OFF");

    // --- Drop old objects if present ---
    db.exec(`
DROP VIEW IF EXISTS v_company_tech;
DROP TABLE IF EXISTS company_tech_rollup_stats;
DROP TABLE IF EXISTS company_tech;
DROP TABLE IF EXISTS technology_fts;
DROP TABLE IF EXISTS technology;
DROP TABLE IF EXISTS company;
    `);

    // --- Create schema ---
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
  link TEXT,
  trends_link TEXT,
  category TEXT,
  first_added DATE
);

CREATE TABLE company_tech (
  company_id INTEGER NOT NULL,
  tech_id INTEGER NOT NULL,
  first_detected DATE NOT NULL,
  last_detected DATE NOT NULL,
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

    // --- Load files ---
    const techIndexPath = path.join(dataDir, "techIndex.sample.json"); // JSON array utf8
    const metaDataPath = path.join(dataDir, "metaData.sample.jsonl"); // JSONL utf16le
    const techDataPath = path.join(dataDir, "techData.sample.jsonl"); // JSONL utf16le

    if (!fs.existsSync(techIndexPath)) throw new Error(`Missing ${techIndexPath}`);
    if (!fs.existsSync(metaDataPath)) throw new Error(`Missing ${metaDataPath}`);
    if (!fs.existsSync(techDataPath)) throw new Error(`Missing ${techDataPath}`);

    const techIndexRaw = JSON.parse(fs.readFileSync(techIndexPath, "utf8"));
    const metaData = parseJsonlLines(metaDataPath, "utf16le");
    const techData = parseJsonlLines(techDataPath, "utf16le");

    console.log(`Loaded: techIndex=${techIndexRaw.length}, metaData=${metaData.length}, techData=${techData.length}`);

    // --- Insert techIndex entries (enforce required fields) ---
    const requiredTechFields = ["Name", "Premium", "Description", "Link", "TrendsLink", "Category", "FirstAdded"];
    const insertTechStmt = db.prepare(`
      INSERT OR IGNORE INTO technology (name, parent_name, premium, description, link, trends_link, category, first_added)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const t of techIndexRaw) {
        const missing = requiredTechFields.filter(f => !(f in t) || t[f] === null || t[f] === undefined || t[f] === "");
        if (missing.length) {
          console.warn(`⚠️ Skipping techIndex entry (missing required): ${missing.join(", ")}  name=${t.Name || "<no name>"}`);
          continue;
        }
        insertTechStmt.run(
          t.Name,
          t.Parent || null,
          t.Premium,
          t.Description,
          t.Link,
          t.TrendsLink,
          t.Category,
          t.FirstAdded
        );
      }
    })();

    // Build tech map
    const techIdByName = new Map<string, number>();
    for (const r of db.prepare("SELECT id, name FROM technology").all()) {
      techIdByName.set(r.name, r.id);
    }

    // --- Insert companies from metaData (only D required) ---
    const insertCompanyStmt = db.prepare(`
      INSERT OR IGNORE INTO company (root_domain, name, category, country, spend, first_indexed, last_indexed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const m of metaData) {
        if (!m || !m.D) {
          console.warn("⚠️ Skipping metaData row missing required D:", m);
          continue;
        }
        insertCompanyStmt.run(
          m.D,
          m.CN || null,
          m.C || null,
          m.CO || null,
          m.SP ?? null,
          m.FI || null,
          m.LI || null
        );
      }
    })();

    // Build company map
    const companyIdByDomain = new Map<string, number>();
    for (const r of db.prepare("SELECT id, root_domain FROM company").all()) {
      companyIdByDomain.set(r.root_domain, r.id);
    }

    // --- Prepare fallback statements ---
    const insertTechFallbackStmt = db.prepare(`
      INSERT OR IGNORE INTO technology (name, parent_name, premium, description, link, trends_link, category, first_added)
      VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    `);

    const insertCompanyPlaceholderStmt = db.prepare(`
      INSERT OR IGNORE INTO company (root_domain, name, category, country, spend, first_indexed, last_indexed)
      VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL)
    `);

    // --- Insert company_tech from techData (enforce required fields) ---
    const insertCompanyTechStmt = db.prepare(`
      INSERT INTO company_tech (company_id, tech_id, first_detected, last_detected)
      VALUES (?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const row of techData) {
        // techData requires: D, SP, FI, LI, T (array)
        if (!row || !row.D || row.SP === undefined || !row.FI || !row.LI || !Array.isArray(row.T)) {
          console.warn("⚠️ Skipping techData row missing required fields (D, SP, FI, LI, T):", row && row.D ? row.D : row);
          continue;
        }

        // Ensure company exists (create placeholder if needed)
        let companyId = companyIdByDomain.get(row.D);
        if (!companyId) {
          insertCompanyPlaceholderStmt.run(row.D);
          const r = db.prepare("SELECT id FROM company WHERE root_domain = ?").get(row.D);
          if (r && r.id) {
            companyId = r.id;
            companyIdByDomain.set(row.D, companyId);
          } else {
            console.warn("⚠️ Could not create/lookup placeholder company for domain:", row.D);
            continue;
          }
        }

        for (const t of row.T) {
          // Each detection requires N, FD, LD
          if (!t || !t.N || !t.FD || !t.LD) {
            console.warn(`⚠️ Skipping detection for ${row.D} missing required fields (N,FD,LD):`, t);
            continue;
          }

          // Ensure technology exists; fallback insert if missing
          let techId = techIdByName.get(t.N);
          if (!techId) {
            insertTechFallbackStmt.run(t.N);
            const rr = db.prepare("SELECT id FROM technology WHERE name = ?").get(t.N);
            if (rr && rr.id) {
              techId = rr.id;
              techIdByName.set(t.N, techId);
            } else {
              console.warn("⚠️ Could not create/find technology for name:", t.N);
              continue;
            }
          }

          // Insert company_tech (FD and LD required per schema)
          try {
            insertCompanyTechStmt.run(companyId, techId, t.FD, t.LD);
          } catch (err) {
            console.warn("⚠️ Failed to insert company_tech for", row.D, t.N, err);
          }
        }
      }
    })();

    // --- Ensure parent_name values also exist in technology table (fallback) ---
    const parentNames = db.prepare("SELECT DISTINCT parent_name FROM technology WHERE parent_name IS NOT NULL").all();
    db.transaction(() => {
      for (const p of parentNames) {
        const pname = p.parent_name;
        if (!pname) continue;
        if (!techIdByName.has(pname)) {
          insertTechFallbackStmt.run(pname);
          const r = db.prepare("SELECT id FROM technology WHERE name = ?").get(pname);
          if (r && r.id) techIdByName.set(pname, r.id);
        }
      }
    })();

    // --- Refresh FTS table (clear then populate) ---
    try {
      db.exec("DELETE FROM technology_fts;");
    } catch (e) {
      // if virtual table not yet populated, ignore
    }
    db.exec(`INSERT INTO technology_fts (rowid, name, category) SELECT id, name, category FROM technology;`);

    // --- Compute rollup stats ---
    const insertRollupStmt = db.prepare(`
      INSERT INTO company_tech_rollup_stats (company_id, parent_tech_id, child_count)
      VALUES (?, ?, ?)
    `);

    db.transaction(() => {
      db.exec("DELETE FROM company_tech_rollup_stats;");
      const companies = db.prepare("SELECT id, root_domain FROM company").all();
      const parents = db.prepare("SELECT DISTINCT parent_name FROM technology WHERE parent_name IS NOT NULL").all();

      for (const comp of companies) {
        for (const pr of parents) {
          const parent_name = pr.parent_name;
          if (!parent_name) continue;
          const cntRow = db.prepare(`
            SELECT COUNT(DISTINCT t.id) as cnt
            FROM company_tech ct
            JOIN technology t ON t.id = ct.tech_id
            WHERE ct.company_id = ? AND t.parent_name = ?
          `).get(comp.id, parent_name);
          const cnt = (cntRow && cntRow.cnt) ? cntRow.cnt : 0;
          if (cnt > 0) {
            const parentId = techIdByName.get(parent_name);
            if (parentId) {
              insertRollupStmt.run(comp.id, parentId, cnt);
            } else {
              console.warn(`⚠️ Parent id missing for parent_name=${parent_name}; skipping rollup for company ${comp.root_domain}`);
            }
          }
        }
      }
    })();

    // --- Create flat view for search ---
    db.exec(`
CREATE VIEW IF NOT EXISTS v_company_tech AS
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

    // --- Indexes ---
    db.exec(`
CREATE INDEX IF NOT EXISTS idx_company_root_domain ON company(root_domain);
CREATE INDEX IF NOT EXISTS idx_company_country ON company(country);
CREATE INDEX IF NOT EXISTS idx_companytech_company ON company_tech(company_id);
CREATE INDEX IF NOT EXISTS idx_companytech_tech ON company_tech(tech_id);
CREATE INDEX IF NOT EXISTS idx_rollup_company ON company_tech_rollup_stats(company_id);
CREATE INDEX IF NOT EXISTS idx_rollup_parent ON company_tech_rollup_stats(parent_tech_id);
    `);

    // --- Re-enable foreign keys and check integrity ---
    db.pragma("foreign_keys = ON");
    const fkProblems = db.prepare("PRAGMA foreign_key_check;").all();
    if (fkProblems.length) {
      console.warn("⚠️ foreign_key_check returned rows (possible orphans):", fkProblems);
    } else {
      console.log("Foreign key integrity OK.");
    }

    console.log(`✅ Database built at ${dbPath}`);
  } catch (err) {
    console.error("❌ Error building database:", err);
    process.exit(1);
  } finally {
    try { db.close(); } catch (e) {}
  }
})();
