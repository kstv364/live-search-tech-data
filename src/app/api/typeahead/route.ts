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
          FROM technologies
          WHERE tech_name LIKE ?
          ORDER BY tech_name
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'company_name':
        sql = `
          SELECT DISTINCT company_name as value
          FROM companies
          WHERE company_name LIKE ?
          ORDER BY company_name
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'root_domain':
        sql = `
          SELECT DISTINCT root_domain as value
          FROM companies
          WHERE root_domain LIKE ?
          ORDER BY root_domain
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'country':
        sql = `
          SELECT DISTINCT country as value
          FROM companies
          WHERE country LIKE ?
          ORDER BY country
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      case 'tech_category':
        sql = `
          SELECT DISTINCT tech_category as value
          FROM technologies
          WHERE tech_category LIKE ?
          ORDER BY tech_category
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;

      default:
        return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    const results = db.prepare(sql).all(...params) as Array<{ value: string }>;
    db.close();

    return NextResponse.json(results.map(r => r.value));
  } catch (error) {
    console.error('Typeahead error:', error);
    return NextResponse.json({ error: 'Typeahead search failed' }, { status: 500 });
  }
}
