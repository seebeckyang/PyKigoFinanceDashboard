// 探測:GitHub Action runner 環境下,哪條連線路徑可用
const { Client } = require("pg");

const SECRET = process.env.SUPABASE_SECRET_KEY;
const URL = process.env.SUPABASE_URL || "https://bmngtlkkumqtnfrlbydh.supabase.co";
const REF = new URL(URL).hostname.split(".")[0];

const candidates = [
    // Session pooler (IPv4, 5432)
    `postgresql://postgres.${REF}:${encodeURIComponent(SECRET)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${REF}:${encodeURIComponent(SECRET)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${REF}:${encodeURIComponent(SECRET)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${REF}:${encodeURIComponent(SECRET)}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
    // Transaction pooler (IPv4, 6543)
    `postgresql://postgres.${REF}:${encodeURIComponent(SECRET)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    // Direct (IPv6)
    `postgresql://postgres:${encodeURIComponent(SECRET)}@db.${REF}.supabase.co:5432/postgres`,
];

(async () => {
    for (const url of candidates) {
        const masked = url.replace(SECRET, "***");
        console.log("\nTRY:", masked);
        const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
        try {
            await client.connect();
            const r = await client.query("select current_user, current_database()");
            console.log("✅ OK", r.rows[0]);
            await client.end();
        } catch (e) {
            console.log("❌", e.code || "", (e.message || "").slice(0, 200));
            try { await client.end(); } catch { }
        }
    }
})();
