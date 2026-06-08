// migrate.js
// 在 GitHub Action runner 上,用 pg 連 Supabase Session Pooler,跑 db/migrations/ 內所有 .sql
// 1. 連線(嘗試多個 pooler region,secret key 當 password)
// 2. 建一張 _migrations 表記錄已跑過的
// 3. 依檔名排序,跑沒跑過的

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const SECRET = process.env.SUPABASE_SECRET_KEY;
const SB_URL = process.env.SUPABASE_URL || "https://bmngtlkkumqtnfrlbydh.supabase.co";
if (!SECRET) { console.error("SUPABASE_SECRET_KEY 未設定"); process.exit(1); }
const REF = new URL(SB_URL).hostname.split(".")[0];

const POOLERS = [
    // 新版 aws-1-*(現行)
    "aws-1-ap-southeast-1.pooler.supabase.com",
    "aws-1-ap-northeast-1.pooler.supabase.com",
    "aws-1-us-east-1.pooler.supabase.com",
    "aws-1-us-east-2.pooler.supabase.com",
    "aws-1-us-west-1.pooler.supabase.com",
    "aws-1-eu-central-1.pooler.supabase.com",
    "aws-1-eu-west-1.pooler.supabase.com",
    "aws-1-eu-west-2.pooler.supabase.com",
    "aws-1-ap-south-1.pooler.supabase.com",
    "aws-1-ap-southeast-2.pooler.supabase.com",
    "aws-1-ca-central-1.pooler.supabase.com",
    "aws-1-sa-east-1.pooler.supabase.com",
    // 興許仍有舊版 aws-0-*
    "aws-0-ap-southeast-1.pooler.supabase.com",
    "aws-0-ap-northeast-1.pooler.supabase.com",
    "aws-0-us-east-1.pooler.supabase.com",
];

async function connect() {
    for (const host of POOLERS) {
        for (const port of [5432, 6543]) {
            const conn = `postgresql://postgres.${REF}:${encodeURIComponent(SECRET)}@${host}:${port}/postgres`;
            const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
            try {
                await client.connect();
                console.log(`✅ Connected via ${host}:${port}`);
                return client;
            } catch (e) {
                console.log(`❌ ${host}:${port}`, (e.message || "").slice(0, 150));
                try { await client.end(); } catch { }
            }
        }
    }
    throw new Error("無任何 Pooler 可連");
}

(async () => {
    const client = await connect();

    await client.query(`
    create table if not exists public._migrations (
      filename text primary key,
      executed_at timestamptz default now()
    )
  `);

    const dir = path.join(__dirname, "..", "migrations");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();
    console.log(`Found ${files.length} migration files`);

    for (const f of files) {
        const exists = await client.query("select 1 from public._migrations where filename=$1", [f]);
        if (exists.rowCount > 0) { console.log(`⏭️  Skip ${f} (already executed)`); continue; }

        const sql = fs.readFileSync(path.join(dir, f), "utf-8");
        console.log(`▶️  Running ${f} (${sql.length} chars)`);
        try {
            await client.query("begin");
            await client.query(sql);
            await client.query("insert into public._migrations(filename) values ($1)", [f]);
            await client.query("commit");
            console.log(`✅ ${f}`);
        } catch (e) {
            await client.query("rollback");
            console.error(`❌ ${f}:`, e.message);
            await client.end();
            process.exit(1);
        }
    }

    await client.end();
    console.log("🎉 All migrations done");
})().catch(e => { console.error(e); process.exit(1); });
