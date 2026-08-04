# TecNois — Sistema de Indicação (projeto de estudo)

## Estrutura
- `index.html` — página de teste (gera link de indicação, mostra contador)
- `api/criar-participante.js` — cria um código único quando alguém completa o quiz
- `api/track.js` — registra quando alguém chega através de um link de indicação
- `api/stats.js` — consulta quantas indicações confirmadas uma pessoa tem
- `schema.sql` — schema do banco de dados (colar no SQL Editor do Supabase)

## Como colocar no ar

1. Crie o projeto no Supabase e rode o `schema.sql` no SQL Editor
2. No Supabase, vá em Project Settings > API e copie: `Project URL` e a chave `service_role` (não a `anon`!)
3. Suba essa pasta pro GitHub (repositório novo)
4. Na Vercel, "Add New Project" > importe esse repositório do GitHub
5. Antes de fazer o deploy, em "Environment Variables", adicione:
   - `SUPABASE_URL` = a Project URL que você copiou
   - `SUPABASE_SERVICE_KEY` = a chave service_role
6. Deploy
7. Abra o link que a Vercel gerou, teste gerar um link de indicação, abra esse link numa aba anônima, volte e atualize o contador

## Importante sobre segurança
A chave `service_role` do Supabase tem acesso total ao banco — por isso ela SÓ pode
viver nas variáveis de ambiente da Vercel, nunca em código que vai pro navegador.
Todo arquivo dentro de `/api` roda no servidor, então está seguro usá-la ali.
