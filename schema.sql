-- Tabela: cada pessoa que fez o quiz e recebeu um código de indicação
create table participants (
  id uuid primary key default gen_random_uuid(),
  ref_code text unique not null,
  nome text,
  whatsapp text,
  perfil_quiz text,
  created_at timestamptz default now()
);

-- Tabela: cada visita/chegada rastreada através de um código de indicação
create table referral_visits (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null references participants(ref_code),
  visitor_fingerprint text not null,
  completou_quiz boolean default false,
  created_at timestamptz default now(),
  unique (ref_code, visitor_fingerprint)
);

-- Índice pra consultar rápido "quantas indicações essa pessoa já tem"
create index idx_referral_visits_ref_code on referral_visits(ref_code);

-- Segurança: impede leitura/escrita direta do navegador sem passar pela nossa função de backend
alter table participants enable row level security;
alter table referral_visits enable row level security;
