const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  const { ref } = req.query;

  if (!ref) {
    return res.status(400).send('Link inválido.');
  }

  const { data: participante } = await supabase
    .from('participants')
    .select('ref_code, campaign_slug')
    .eq('ref_code', ref)
    .single();

  if (!participante) {
    return res.status(404).send('Link de indicação não encontrado.');
  }

  const { data: campanha } = await supabase
    .from('campaigns')
    .select('destino_url')
    .eq('slug', participante.campaign_slug)
    .single();

  const destino = (campanha && campanha.destino_url) || '/';

  // marca "já contado" via cookie no navegador de quem clicou — evita
  // contar a mesma pessoa de novo se ela abrir o link outra vez
  const cookieName = 'tn_v_' + ref;
  const cookies = req.headers.cookie || '';
  const jaContado = cookies.includes(cookieName + '=1');

  if (!jaContado) {
    const visitorFingerprint = 'redir_' + Math.random().toString(36).substring(2) + Date.now();

    await supabase
      .from('referral_visits')
      .upsert(
        { ref_code: ref, visitor_fingerprint: visitorFingerprint, completou_quiz: true },
        { onConflict: 'ref_code,visitor_fingerprint', ignoreDuplicates: true }
      );

    res.setHeader('Set-Cookie', `${cookieName}=1; Max-Age=31536000; Path=/; SameSite=Lax`);
  }

  res.writeHead(302, { Location: destino });
  res.end();
};
