// src/setup.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

// ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../data_model");
const dbPath = path.join(dataDir, "builtwith.db");

// Utility: parse JSONL using readFileSync + split (utf16le)
function parseJsonlLines(filePath: string, encoding = "utf16le") {
  if (!fs.existsSync(filePath)) throw new Error(`Missing file ${filePath}`);
  const raw = fs.readFileSync(filePath, encoding);
  const noBom = raw.replace(/^\uFEFF/, "");
  const lines = noBom.split(/\r?\n/);
  const items: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      items.push(JSON.parse(line));
    } catch (err) {
      console.warn(`Skipping invalid JSON on line ${i + 1} of ${path.basename(filePath)}:`, err);
      continue;
    }
  }
  return items;
}
// Main
(function main() {
  // open DB
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  try {
    // Disable fkeys while (re)creating schema to avoid DROP ordering issues
    db.pragma("foreign_keys = OFF");

    // --- Drop old schema ---
    db.exec(`
DROP VIEW IF EXISTS v_company_tech;
DROP TABLE IF EXISTS company_tech_rollup_stats;
DROP TABLE IF EXISTS site_technology;
DROP TABLE IF EXISTS site;
DROP TABLE IF EXISTS company_email;
DROP TABLE IF EXISTS company_phone;
DROP TABLE IF EXISTS company_social;
DROP TABLE IF EXISTS person;
DROP TABLE IF EXISTS company_tech;
DROP TABLE IF EXISTS technology_fts;
DROP TABLE IF EXISTS technology;
DROP TABLE IF EXISTS company;
    `);

    // --- Create tables (match final ERD; allow optional NULLs) ---
    db.exec(`
CREATE TABLE company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  root_domain TEXT UNIQUE NOT NULL,
  name TEXT,
  category TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  spend INTEGER,
  first_indexed DATE,
  last_indexed DATE
);

CREATE TABLE person (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  name TEXT,
  title TEXT,
  FOREIGN KEY(company_id) REFERENCES company(id)
);

CREATE TABLE company_email (
  company_id INTEGER,
  email TEXT,
  FOREIGN KEY(company_id) REFERENCES company(id)
);

CREATE TABLE company_phone (
  company_id INTEGER,
  phone TEXT,
  FOREIGN KEY(company_id) REFERENCES company(id)
);

CREATE TABLE company_social (
  company_id INTEGER,
  url TEXT,
  FOREIGN KEY(company_id) REFERENCES company(id)
);

CREATE TABLE site (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  root_domain TEXT,
  subdomain TEXT,
  monthly_spend_usd INTEGER,
  first_indexed DATE,
  last_indexed DATE,
  FOREIGN KEY(company_id) REFERENCES company(id)
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
  first_added DATE,
  ticker TEXT,
  exchange TEXT,
  public_company_type TEXT,
  public_company_name TEXT
);

CREATE TABLE site_technology (
  site_id INTEGER NOT NULL,
  tech_id INTEGER NOT NULL,
  first_detected DATE NOT NULL,
  last_detected DATE NOT NULL,
  FOREIGN KEY(site_id) REFERENCES site(id),
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

    // --- Load source files ---
    const techIndexPath = path.join(dataDir, "techIndex.sample.json"); // JSON array (utf8)
    const metaDataPath = path.join(dataDir, "metaData.sample.jsonl"); // JSONL (utf16le)
    const techDataPath = path.join(dataDir, "techData.sample.jsonl"); // JSONL (utf16le)

    if (!fs.existsSync(techIndexPath)) throw new Error(`Missing ${techIndexPath}`);
    if (!fs.existsSync(metaDataPath)) throw new Error(`Missing ${metaDataPath}`);
    if (!fs.existsSync(techDataPath)) throw new Error(`Missing ${techDataPath}`);

    const techIndex = JSON.parse(fs.readFileSync(techIndexPath, "utf8"));
    const metaData = parseJsonlLines(metaDataPath, "utf16le");
    const techData = parseJsonlLines(techDataPath, "utf16le");

    console.log(`Loaded: techIndex=${techIndex.length}, metaData=${metaData.length}, techData=${techData.length}`);

    // --- Insert technology entries (techIndex required fields enforced) ---
    const requiredTechFields = ["Name", "Premium", "Description", "Link", "TrendsLink", "Category", "FirstAdded"];

    const insertTech = db.prepare(`
      INSERT OR IGNORE INTO technology (name, parent_name, premium, description, link, trends_link, category, first_added, ticker, exchange, public_company_type, public_company_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const t of techIndex) {
        const missing = requiredTechFields.filter(f => !(f in t) || t[f] === null || t[f] === undefined || t[f] === "");
        if (missing.length) {
          console.warn(`Skipping techIndex entry missing required fields [${missing.join(",")}] name=${t.Name || "<no name>"}`);
          continue;
        }
        insertTech.run(
          t.Name,
          t.Parent || null,
          t.Premium,
          t.Description,
          t.Link,
          t.TrendsLink,
          t.Category,
          t.FirstAdded,
          t.Ticker || null,
          t.Exchange || null,
          t.PublicCompanyType || null,
          t.PublicCompanyName || null
        );
      }
    })();

    // Build technology map
    const techIdByName = new Map<string, number>();
    for (const r of db.prepare("SELECT id, name FROM technology").all()) {
      techIdByName.set(r.name, r.id);
    }

    // --- Insert companies and associated metadata (metaData; D required) ---
    const insertCompany = db.prepare(`
      INSERT OR IGNORE INTO company (root_domain, name, category, city, state, country, postal_code, spend, first_indexed, last_indexed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPerson = db.prepare(`INSERT INTO person (company_id, name, title) VALUES (?, ?, ?)`);
    const insertEmail = db.prepare(`INSERT INTO company_email (company_id, email) VALUES (?, ?)`);
    const insertPhone = db.prepare(`INSERT INTO company_phone (company_id, phone) VALUES (?, ?)`);
    const insertSocial = db.prepare(`INSERT INTO company_social (company_id, url) VALUES (?, ?)`);

    db.transaction(() => {
      for (const m of metaData) {
        if (!m || !m.D) {
          console.warn("Skipping metaData row missing required D:", m);
          continue;
        }
        insertCompany.run(
          m.D,                   // root_domain
          m.CN || null,          // name
          m.CAT || null,         // category (note: abbreviation CAT)
          m.C || null,           // city (C)
          m.ST || null,          // state (ST)
          m.CO || null,          // country (CO)
          m.Z || null,           // postal_code (Z)
          m.SP ?? null,          // spend (some meta might include SP)
          m.FI || null,          // first_indexed (FI) if present
          m.LI || null           // last_indexed (LI) if present
        );

        // lookup the company_id for related inserts
        const compRow = db.prepare("SELECT id FROM company WHERE root_domain = ?").get(m.D);
        const companyId = compRow ? compRow.id : null;
        if (!companyId) continue;

        // People (P) array -> person table (Name, Title)
        if (Array.isArray(m.P)) {
          for (const p of m.P) {
            if (p && p.Name) {
              insertPerson.run(companyId, p.Name, p.Title || null);
            }
          }
        }

        // Emails (E)
        if (Array.isArray(m.E)) {
          for (const e of m.E) {
            if (e) insertEmail.run(companyId, e);
          }
        }

        // Phones (T)
        if (Array.isArray(m.T)) {
          for (const ph of m.T) {
            if (ph) insertPhone.run(companyId, ph);
          }
        }

        // Social Links (S)
        if (Array.isArray(m.S)) {
          for (const s of m.S) {
            if (s) insertSocial.run(companyId, s);
          }
        }
      }
    })();

    // Build company map
    const companyIdByDomain = new Map<string, number>();
    for (const r of db.prepare("SELECT id, root_domain FROM company").all()) {
      companyIdByDomain.set(r.root_domain, r.id);
    }

    // --- Prepare statements for fallback inserts and site & site_technology insertion ---
    const insertTechFallback = db.prepare(`INSERT OR IGNORE INTO technology (name) VALUES (?)`);
    const insertCompanyPlaceholder = db.prepare(`INSERT OR IGNORE INTO company (root_domain) VALUES (?)`);
    const selectSiteByCompanyAndSubdomain = db.prepare(`SELECT id FROM site WHERE company_id = ? AND subdomain IS ?`);
    const insertSite = db.prepare(`
      INSERT INTO site (company_id, root_domain, subdomain, monthly_spend_usd, first_indexed, last_indexed)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateSite = db.prepare(`
      UPDATE site SET monthly_spend_usd = ?, first_indexed = ?, last_indexed = ?
      WHERE id = ?
    `);
    const getSiteById = db.prepare(`SELECT id FROM site WHERE company_id = ? AND subdomain IS ?`);
    const insertSiteTech = db.prepare(`
      INSERT INTO site_technology (site_id, tech_id, first_detected, last_detected)
      VALUES (?, ?, ?, ?)
    `);

    // Helper to find/create site and return site_id
    function upsertSite(companyId: number, rootDomain: string, subdomain: string | null, monthlySpend: number | null, firstIndexed: string | null, lastIndexed: string | null) {
      // Use IS operator for NULL subdomains in SQLite query (we pass null for subdomain)
      const existing = db.prepare(`SELECT id FROM site WHERE company_id = ? AND (subdomain IS ? OR subdomain = ?) LIMIT 1`).get(companyId, subdomain, subdomain || "");
      if (existing && existing.id) {
        // update monthly spend / index dates if provided (overwrite)
        updateSite.run(monthlySpend ?? null, firstIndexed ?? null, lastIndexed ?? null, existing.id);
        return existing.id;
      } else {
        const info = insertSite.run(companyId, rootDomain, subdomain ?? null, monthlySpend ?? null, firstIndexed ?? null, lastIndexed ?? null);
        // better-sqlite3 returns info.lastInsertRowid
        return Number(info.lastInsertRowid);
      }
    }

    // --- Insert site & site_technology from techData (enforce required fields) ---
    db.transaction(() => {
      for (const row of techData) {
        // techData required: D, SP, FI, LI, T (array) per schema
        if (!row || !row.D || row.SP === undefined || !row.FI || !row.LI || !Array.isArray(row.T)) {
          console.warn("Skipping techData row missing required fields (D, SP, FI, LI, T[]):", row && row.D ? row.D : row);
          continue;
        }

        // Ensure company exists (create placeholder if missing)
        let companyId = companyIdByDomain.get(row.D);
        if (!companyId) {
          insertCompanyPlaceholder.run(row.D);
          const r = db.prepare("SELECT id FROM company WHERE root_domain = ?").get(row.D);
          if (r && r.id) {
            companyId = r.id;
            companyIdByDomain.set(row.D, companyId);
          } else {
            console.warn("Could not create or find placeholder company for domain:", row.D);
            continue;
          }
        }

        // site subdomain SD may be null or a string
        const sd = (row.SD === undefined || row.SD === null || row.SD === "") ? null : row.SD;

        // Upsert site: use companyId, root_domain=row.D, subdomain=sd
        const siteId = upsertSite(companyId, row.D, sd, row.SP ?? null, row.FI || null, row.LI || null);

        if (!siteId) {
          console.warn("Failed to create/lookup site for company:", row.D, "SD:", sd);
          continue;
        }

        // For each detection, ensure N, FD, LD present
        for (const t of row.T) {
          if (!t || !t.N || !t.FD || !t.LD) {
            console.warn(`Skipping detection for ${row.D} (site ${sd || "<root>"} ) missing required N/FD/LD:`, t);
            continue;
          }

          // Ensure technology exists; if not, fallback-insert
          let techId = techIdByName.get(t.N);
          if (!techId) {
            insertTechFallback.run(t.N);
            const tr = db.prepare("SELECT id FROM technology WHERE name = ?").get(t.N);
            if (tr && tr.id) {
              techId = tr.id;
              techIdByName.set(t.N, techId);
            } else {
              console.warn("Could not create/find fallback technology for name:", t.N);
              continue;
            }
          }

          // Insert site_technology (first_detected, last_detected are required by schema)
          try {
            insertSiteTech.run(siteId, techId, t.FD, t.LD);
          } catch (err) {
            console.warn("Failed to insert site_technology:", err);
            // continue with next detection
          }
        }
      }
    })();

    // --- Ensure parent technology rows exist for any parent_name references (fallback) ---
    db.transaction(() => {
      const parents = db.prepare("SELECT DISTINCT parent_name FROM technology WHERE parent_name IS NOT NULL AND parent_name != ''").all();
      for (const p of parents) {
        const parentName = p.parent_name;
        if (!parentName) continue;
        if (!techIdByName.has(parentName)) {
          insertTechFallback.run(parentName);
          const r = db.prepare("SELECT id FROM technology WHERE name = ?").get(parentName);
          if (r && r.id) techIdByName.set(parentName, r.id);
        }
      }
    })();

    // --- Refresh FTS (clear then repopulate) ---
    try { db.exec("DELETE FROM technology_fts;"); } catch (e) { /* ignore if empty */ }
    db.exec(`INSERT INTO technology_fts (rowid, name, category) SELECT id, name, category FROM technology;`);

    // --- Compute rollup stats (company-level counts of child techs under each parent) ---
    const insertRollup = db.prepare(`INSERT INTO company_tech_rollup_stats (company_id, parent_tech_id, child_count) VALUES (?, ?, ?)`);
    db.transaction(() => {
      db.exec("DELETE FROM company_tech_rollup_stats;");
      // Build lists
      const companies = db.prepare("SELECT id, root_domain FROM company").all();
      const parentNames = db.prepare("SELECT DISTINCT parent_name FROM technology WHERE parent_name IS NOT NULL AND parent_name != ''").all();

      for (const comp of companies) {
        for (const pr of parentNames) {
          const pname = pr.parent_name;
          if (!pname) continue;
          const cntRow = db.prepare(`
            SELECT COUNT(DISTINCT t.id) AS cnt
            FROM site_technology st
            JOIN technology t ON t.id = st.tech_id
            JOIN site s ON s.id = st.site_id
            WHERE s.company_id = ? AND t.parent_name = ?
          `).get(comp.id, pname);
          const cnt = (cntRow && cntRow.cnt) ? cntRow.cnt : 0;
          if (cnt > 0) {
            const parentId = techIdByName.get(pname);
            if (parentId) {
              insertRollup.run(comp.id, parentId, cnt);
            } else {
              console.warn(`Parent tech id missing for name=${pname}; skipping rollup for ${comp.root_domain}`);
            }
          }
        }
      }
    })();

    // --- Create flat view for search (company + site + technology flattened) ---
    db.exec(`
CREATE VIEW IF NOT EXISTS v_company_tech AS
SELECT
  c.id as company_id,
  c.root_domain,
  c.name as company_name,
  c.category as company_category,
  c.city,
  c.state,
  c.country,
  c.postal_code,
  c.spend as company_spend,
  c.first_indexed as company_first_indexed,
  c.last_indexed as company_last_indexed,
  s.id as site_id,
  s.root_domain as site_root_domain,
  s.subdomain as site_subdomain,
  s.monthly_spend_usd,
  s.first_indexed as site_first_indexed,
  s.last_indexed as site_last_indexed,
  t.id as tech_id,
  t.name as tech_name,
  t.category as tech_category,
  t.parent_name,
  st.first_detected,
  st.last_detected
FROM company c
LEFT JOIN site s ON s.company_id = c.id
LEFT JOIN site_technology st ON st.site_id = s.id
LEFT JOIN technology t ON t.id = st.tech_id;
    `);

    // --- Indexes to speed up queries ---
    db.exec(`
CREATE INDEX IF NOT EXISTS idx_company_root_domain ON company(root_domain);
CREATE INDEX IF NOT EXISTS idx_company_country ON company(country);
CREATE INDEX IF NOT EXISTS idx_site_company_subdomain ON site(company_id, subdomain);
CREATE INDEX IF NOT EXISTS idx_site_root_domain ON site(root_domain);
CREATE INDEX IF NOT EXISTS idx_site_tech_site ON site_technology(site_id);
CREATE INDEX IF NOT EXISTS idx_site_tech_tech ON site_technology(tech_id);
CREATE INDEX IF NOT EXISTS idx_rollup_company ON company_tech_rollup_stats(company_id);
CREATE INDEX IF NOT EXISTS idx_rollup_parent ON company_tech_rollup_stats(parent_tech_id);
    `);

    // Re-enable foreign keys and check
    db.pragma("foreign_keys = ON");
    const fkProblems = db.prepare("PRAGMA foreign_key_check;").all();
    if (fkProblems.length) {
      console.warn("foreign_key_check returned rows (possible orphans):", fkProblems);
    } else {
      console.log("Foreign key integrity OK.");
    }

    console.log(`✅ builtwith sqlite DB written to ${dbPath}`);
  } catch (err) {
    console.error("ERROR building DB:", err);
    process.exit(1);
  } finally {
    try { db.close(); } catch (e) { /* ignore */ }
  }
})();
