import { NextRequest, NextResponse } from 'next/server';
import { SearchObject, FilterCondition } from '@/lib/types';
import Database from 'better-sqlite3';

export async function POST(req: NextRequest) {
  try {
    const searchObject: SearchObject = await req.json();
    const db = new Database('./database/builtwith.db');

    // Build the SQL query based on the search object
    let sql = buildSearchQuery(searchObject);
    
    // Execute the query
    const results = db.prepare(sql.query).all(...sql.params);
    
    // Get total count for pagination
    const countSql = buildCountQuery(searchObject);
    const result = db.prepare(countSql.query).get(...countSql.params) as { total: number };
    const total = result.total;

    db.close();

    return NextResponse.json({ results, total });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

function buildSearchQuery(searchObject: SearchObject) {
  const params: (string | number)[] = [];
  let query = `
    SELECT DISTINCT
      company_name,
      root_domain,
      company_category,
      country,
      company_spend as spend,
      tech_name,
      tech_category,
      first_detected as first_indexed,
      last_detected as last_indexed
    FROM v_company_tech
    WHERE 1=1
  `;

  if (searchObject.filters) {
    const { whereClause, whereParams } = buildWhereClause(searchObject.filters);
    query += ' AND ' + whereClause;
    params.push(...whereParams);
  }

  if (searchObject.sort && searchObject.sort.length > 0) {
    query += ' ORDER BY ' + searchObject.sort
      .map(sort => `${sort.field} ${sort.direction}`)
      .join(', ');
  }

  if (typeof searchObject.limit === 'number') {
    query += ' LIMIT ?';
    params.push(searchObject.limit);
  }

  if (typeof searchObject.offset === 'number') {
    query += ' OFFSET ?';
    params.push(searchObject.offset);
  }

  return { query, params };
}

function buildCountQuery(searchObject: SearchObject) {
  const params: (string | number)[] = [];
  let query = `
    SELECT COUNT(DISTINCT company_id) as total
    FROM v_company_tech
    WHERE 1=1
  `;

  if (searchObject.filters) {
    const { whereClause, whereParams } = buildWhereClause(searchObject.filters);
    query += ' AND ' + whereClause;
    params.push(...whereParams);
  }

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
      const filterCondition = condition as FilterCondition;
      switch (filterCondition.operator) {
        case 'LIKE':
          clause = `${filterCondition.field} LIKE ?`;
          params.push(`%${filterCondition.value}%`);
          break;
        case 'IN':
        case 'NOT IN':
          const values = Array.isArray(filterCondition.value) ? filterCondition.value : [filterCondition.value];
          clause = `${filterCondition.field} ${filterCondition.operator} (${values.map(() => '?').join(',')})`;
          params.push(...values);
          break;
        case 'BETWEEN':
          const [start, end] = Array.isArray(filterCondition.value) ? filterCondition.value : [filterCondition.value];
          clause = `${filterCondition.field} BETWEEN ? AND ?`;
          params.push(start, end);
          break;
        default:
          clause = `${filterCondition.field} ${filterCondition.operator} ?`;
          params.push(Array.isArray(filterCondition.value) ? filterCondition.value[0] : filterCondition.value);
      }
      conditions.push(clause);
    }
  }

  const whereClause = conditions.length > 0
    ? conditions.join(` ${filterGroup.operator} `)
    : '1=1';

  return { whereClause, whereParams: params };
}
