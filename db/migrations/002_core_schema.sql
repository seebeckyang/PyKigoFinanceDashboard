-- ============================================================================
--  002_core_schema.sql
--  家庭財務戰情室核心 schema:8 張表 + 索引 + RLS
--  (透過 admin_exec_sql 一段段執行)
-- ============================================================================

-- ─── institutions(金融機構,例:永豐金控 / Firstrade / 國泰人壽)─────────────
create table if not exists public.institutions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null check (type in ('bank','broker','insurance','crypto','other')),
  country       text,
  sort_order    int default 100,
  hidden        boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── accounts(帳戶,例:永豐銀行-大戶 / Firstrade 活存)─────────────────────
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  name            text not null,
  account_type    text not null check (account_type in ('checking','savings','time_deposit','foreign_currency','brokerage','crypto')),
  currency        text not null default 'TWD',
  balance         numeric(20,4) not null default 0,
  note            text,
  sort_order      int default 100,
  hidden          boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── holdings(持股 / ETF)──────────────────────────────────────────────────
create table if not exists public.holdings (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  symbol          text not null,
  name            text,
  market          text check (market in ('US','TW','HK','JP','OTHER')),
  shares          numeric(20,6) not null default 0,
  avg_cost        numeric(20,6),
  market_price    numeric(20,6),  -- 系統自動更新
  currency        text not null default 'USD',
  market_value    numeric(20,4),  -- shares × market_price,系統算
  classification  text check (classification in ('core','growth','speculative','other')),
  price_locked    boolean default false,  -- true = 手動填,系統不抓
  last_quote_at   timestamptz,
  sort_order      int default 100,
  hidden          boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── funds(基金)───────────────────────────────────────────────────────────
create table if not exists public.funds (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  fund_code       text,
  name            text not null,
  market_value    numeric(20,4) not null default 0,
  currency        text not null default 'USD',
  note            text,
  sort_order      int default 100,
  hidden          boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── policies(保單)────────────────────────────────────────────────────────
create table if not exists public.policies (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  policy_name     text not null,
  policy_type     text,
  current_value   numeric(20,4) not null default 0,
  currency        text not null default 'USD',
  note            text,
  sort_order      int default 100,
  hidden          boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── subscriptions(訂閱)──────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  service_name    text not null,
  amount          numeric(20,4) not null,
  currency        text not null default 'TWD',
  cycle           text not null check (cycle in ('monthly','quarterly','yearly','custom')),
  cycle_days      int,
  next_charge_at  date,
  payment_method  text,
  category        text,
  planned_cancel  boolean default false,
  note            text,
  hidden          boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── snapshots(每日資產快照,給歷史線圖 / 集中度回測)──────────────────────
create table if not exists public.daily_snapshots (
  id              uuid primary key default gen_random_uuid(),
  snapshot_date   date not null,
  total_twd       numeric(20,4),
  composition     jsonb,  -- {cash:x, stocks:y, funds:z, policies:w, crypto:v}
  raw             jsonb,  -- 完整當時帳戶+持股快照
  created_at      timestamptz default now(),
  unique(snapshot_date)
);

-- ─── alerts(系統示警:集中度 / 訂閱續費 / 大額變動)────────────────────────
create table if not exists public.alerts (
  id              uuid primary key default gen_random_uuid(),
  alert_type      text not null check (alert_type in ('concentration','subscription_renewal','large_move','goal_progress','other')),
  severity        text not null check (severity in ('info','warning','danger')),
  title           text not null,
  body            text,
  ref_table       text,
  ref_id          uuid,
  acknowledged    boolean default false,
  created_at      timestamptz default now()
);

-- ─── 索引 ─────────────────────────────────────────────────────────────────
create index if not exists idx_accounts_institution on public.accounts(institution_id);
create index if not exists idx_holdings_institution on public.holdings(institution_id);
create index if not exists idx_holdings_symbol on public.holdings(symbol);
create index if not exists idx_funds_institution on public.funds(institution_id);
create index if not exists idx_policies_institution on public.policies(institution_id);
create index if not exists idx_subscriptions_next_charge on public.subscriptions(next_charge_at);
create index if not exists idx_snapshots_date on public.daily_snapshots(snapshot_date desc);
create index if not exists idx_alerts_created on public.alerts(created_at desc);

-- ─── updated_at trigger ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array['institutions','accounts','holdings','funds','policies','subscriptions'])
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ─── RLS:本系統單一家庭使用,全部用 service_role 後端寫入,前端用 anon 唯讀 ──
alter table public.institutions enable row level security;
alter table public.accounts enable row level security;
alter table public.holdings enable row level security;
alter table public.funds enable row level security;
alter table public.policies enable row level security;
alter table public.subscriptions enable row level security;
alter table public.daily_snapshots enable row level security;
alter table public.alerts enable row level security;

-- 給 anon 唯讀(因為前端在內網用,且實際 CRUD 透過 server API)
do $$
declare t text;
begin
  for t in select unnest(array['institutions','accounts','holdings','funds','policies','subscriptions','daily_snapshots','alerts'])
  loop
    execute format('drop policy if exists "anon read %s" on public.%I', t, t);
    execute format('create policy "anon read %s" on public.%I for select to anon using (true)', t, t);
  end loop;
end $$;
