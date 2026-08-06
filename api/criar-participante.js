const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function gerarCodigo() {
  return 'TN' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { nome, whatsapp, perfilQuiz, campanha, ownerFingerprint } = req.body || {};
  const campaignSlug = campanha || 'tecnois';

  const { data: campanhaValida } = await supabase
    .from('campaigns')
    .select('slug')
    .eq('slug', campaignSlug)
    .eq('ativo', true)
    .single();

  if (!campanhaValida) {
    return res.status(400).json({ erro: 'Campanha inválida ou inativa' });
  }

  let refCode = gerarCodigo();

  let tentativas = 0;
  let data, error;
  do {
    ({ data, error } = await supabase
      .from('participants')
      .insert({
        ref_code: refCode,
        nome,
        whatsapp,
        perfil_quiz: perfilQuiz,
        campaign_slug: campaignSlug,
        owner_fingerprint: ownerFingerprint || null
      })
      .select()
      .single());
    if (error && error.code === '23505') {
      refCode = gerarCodigo();
      tentativas++;
    }
  } while (error && error.code === '23505' && tentativas < 5);

  if (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Não foi possível criar o participante' });
  }

  return res.status(200).json({ refCode: data.ref_code, campanha: campaignSlug });
};
