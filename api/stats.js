const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { refCode, visitorFingerprint } = req.body || {};

  if (!refCode || !visitorFingerprint) {
    return res.status(400).json({ erro: 'Faltam dados' });
  }

  const { data: participante } = await supabase
    .from('participants')
    .select('ref_code, owner_fingerprint')
    .eq('ref_code', refCode)
    .single();

  if (!participante) {
    return res.status(404).json({ erro: 'Código de indicação inválido' });
  }

  // proteção contra auto-indicação: se quem está chegando é o próprio dono do link, não conta
  if (participante.owner_fingerprint && participante.owner_fingerprint === visitorFingerprint) {
    return res.status(200).json({ ok: true, contado: false, motivo: 'auto-indicacao-ignorada' });
  }

  const { error } = await supabase
    .from('referral_visits')
    .upsert(
      { ref_code: refCode, visitor_fingerprint: visitorFingerprint, completou_quiz: true },
      { onConflict: 'ref_code,visitor_fingerprint', ignoreDuplicates: true }
    );

  if (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Não foi possível registrar' });
  }

  return res.status(200).json({ ok: true, contado: true });
};
