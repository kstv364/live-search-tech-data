import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const field = searchParams.get('field');
    const query = searchParams.get('q');

    if (!field || !query) {
      return NextResponse.json({ error: 'Missing field or query parameter' }, { status: 400 });
    }

    const db = new Database('./database/builtwith.db');
    let sql = '';
    let params: string[] = [];

    switch (field) {
      case 'tech_name':
        sql = `
          SELECT DISTINCT tech_name as value
          FROM v_company_tech
          WHERE tech_name LIKE ? AND tech_name IS NOT NULL
          ORDER BY tech_name
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'company_name':
        sql = `
          SELECT DISTINCT company_name as value
          FROM v_company_tech
          WHERE company_name LIKE ? AND company_name IS NOT NULL
          ORDER BY company_name
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'root_domain':
        sql = `
          SELECT DISTINCT root_domain as value
          FROM v_company_tech
          WHERE root_domain LIKE ? AND root_domain IS NOT NULL
          ORDER BY root_domain
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'country':
        sql = `
          SELECT DISTINCT country as value
          FROM v_company_tech
          WHERE country LIKE ? AND country IS NOT NULL
          ORDER BY country
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'city':
        sql = `
          SELECT DISTINCT city as value
          FROM v_company_tech
          WHERE city LIKE ? AND city IS NOT NULL
          ORDER BY city
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'state':
        sql = `
          SELECT DISTINCT state as value
          FROM v_company_tech
          WHERE state LIKE ? AND state IS NOT NULL
          ORDER BY state
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'postal_code':
        sql = `
          SELECT DISTINCT postal_code as value
          FROM v_company_tech
          WHERE postal_code LIKE ? AND postal_code IS NOT NULL
          ORDER BY postal_code
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'tech_category':
        sql = `
          SELECT DISTINCT tech_category as value
          FROM v_company_tech
          WHERE tech_category LIKE ? AND tech_category IS NOT NULL
          ORDER BY tech_category
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'company_category':
        sql = `
          SELECT DISTINCT company_category as value
          FROM v_company_tech
          WHERE company_category LIKE ? AND company_category IS NOT NULL
          ORDER BY company_category
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'parent_tech_name':
        sql = `
          SELECT DISTINCT parent_name as value
          FROM v_company_tech
          WHERE parent_name LIKE ? AND parent_name IS NOT NULL
          ORDER BY parent_name
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'description':
        sql = `
          SELECT DISTINCT description as value
          FROM v_company_tech
          WHERE description LIKE ? AND description IS NOT NULL
          ORDER BY description
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      default:
        return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    const results = db.prepare(sql).all(...params) as Array<{ value: string }>;
    db.close();

    // Filter out null/undefined values and ensure we return an array of strings
    const cleanResults = results
      .map(r => r.value)
      .filter(value => value != null && value !== '')
      .slice(0, 10); // Ensure we don't return more than 10 items

    return NextResponse.json(cleanResults);
  } catch (error) {
    console.error('Typeahead error:', error);
    return NextResponse.json({ error: 'Typeahead search failed' }, { status: 500 });
  }
}
