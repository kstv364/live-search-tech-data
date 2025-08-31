import { NextRequest, NextResponse } from 'next/server';
import { SearchObject } from '@/lib/types';
import { convertToCSV, DEFAULT_COLUMNS, generateFilename } from '@/lib/csvExport';
import Database from 'better-sqlite3';

// Maximum number of records to export in a single request
const MAX_EXPORT_LIMIT = 50000;

export async function POST(req: NextRequest) {
  try {
    const { searchObject, limit = 1000 } = await req.json();
    
    // Validate limit
    const exportLimit = Math.min(limit, MAX_EXPORT_LIMIT);
    
    const db = new Database('./database/builtwith.db');

    // Build the SQL query for export (without pagination)
    const sql = buildExportQuery(searchObject, exportLimit);
    
    // Execute the query
    const results = db.prepare(sql.query).all(...sql.params);
    
    // Get total count to inform user if results were truncated
    const countSql = buildCountQuery(searchObject);
    const countResult = db.prepare(countSql.query).get(...countSql.params) as { total: number };
    const totalAvailable = countResult.total;

    db.close();

    // Convert to CSV
    const csvContent = convertToCSV(results, DEFAULT_COLUMNS);
    
    // Generate filename
    const filename = generateFilename('company-search-export');

    return NextResponse.json({ 
      csvContent, 
      filename,
      recordsExported: results.length,
      totalAvailable,
      truncated: results.length < totalAvailable
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function buildExportQuery(searchObject: SearchObject, limit: number) {
  const params: (string | number)[] = [];
  let query = `
    WITH filtered_results AS (
      SELECT DISTINCT
        company_name,
        root_domain,
        company_category,
        country,
        city,
        state,
        postal_code,
        company_spend as spend,
        company_first_indexed as first_indexed,
        company_last_indexed as last_indexed,
        tech_name,
        tech_category,
        parent_name as parent_tech_name,
        premium,
        description
      FROM v_company_tech
      WHERE 1=1
  `;

  if (searchObject.filters) {
    const { whereClause, whereParams } = buildWhereClause(searchObject.filters);
    query += ' AND ' + whereClause;
    params.push(...whereParams);
  }

  query += `) SELECT * FROM filtered_results`;

  // Apply sorting if specified
  if (searchObject.sort && searchObject.sort.length > 0) {
    query += ' ORDER BY ' + searchObject.sort
      .map(sort => `${sort.field} ${sort.direction}`)
      .join(', ');
  } else {
    // Default sorting for consistent exports
    query += ' ORDER BY company_name ASC';
  }

  // Add limit for export
  query += ` LIMIT ${limit}`;

  return { query, params };
}

function buildCountQuery(searchObject: SearchObject) {
  const params: (string | number)[] = [];
  let query = `
    WITH filtered_results AS (
      SELECT DISTINCT
        company_name,
        root_domain,
        company_category,
        country,
        city,
        state,
        postal_code,
        company_spend as spend,
        company_first_indexed as first_indexed,
        company_last_indexed as last_indexed,
        tech_name,
        tech_category,
        parent_name as parent_tech_name,
        premium,
        description
      FROM v_company_tech
      WHERE 1=1
  `;

  if (searchObject.filters) {
    const { whereClause, whereParams } = buildWhereClause(searchObject.filters);
    query += ' AND ' + whereClause;
    params.push(...whereParams);
  }

  query += `) SELECT COUNT(*) as total FROM filtered_results`;
  return { query, params };
}

function buildWhereClause(filterGroup: SearchObject['filters']) {
  const params: (string | number)[] = [];
  const conditions: string[] = [];

  for (const condition of filterGroup.conditions) {
    if ('conditions' in condition) {
      // This is a nested filter group
      const { whereClause, whereParams } = buildWhereClause(condition);
      conditions.push(`(${whereClause})`);
      params.push(...whereParams);
    } else {
      // This is a filter condition
      let clause: string;
      switch (condition.operator) {
        case 'LIKE':
          clause = `${condition.field} LIKE ?`;
          params.push(`%${condition.value}%`);
          break;
        case 'IN':
        case 'NOT IN':
          const values = Array.isArray(condition.value) ? condition.value : [condition.value];
          clause = `${condition.field} ${condition.operator} (${values.map(() => '?').join(',')})`;
          params.push(...values);
          break;
        case 'BETWEEN':
          const [start, end] = Array.isArray(condition.value) ? condition.value : [condition.value];
          clause = `${condition.field} BETWEEN ? AND ?`;
          params.push(start, end);
          break;
        default:
          clause = `${condition.field} ${condition.operator} ?`;
          params.push(Array.isArray(condition.value) ? condition.value[0] : condition.value);
      }
      conditions.push(clause);
    }
  }

  const whereClause = conditions.length > 0
    ? conditions.join(` ${filterGroup.operator} `)
    : '1=1';

  return { whereClause, whereParams: params };
}
