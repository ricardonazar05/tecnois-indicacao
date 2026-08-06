const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  const senhaEnviada = req.headers['x-admin-key'];

  if (!process.env.ADMIN_PASSWORD || senhaEnviada !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ erro: 'Senha inválida' });
  }

  const { campanha } = req.query;

  // busca participantes (opcionalmente filtrando por campanha)
  let query = supabase
    .from('participants')
    .select('ref_code, nome, whatsapp, campaign_slug, premio_notificado, created_at')
    .order('created_at', { ascending: false });

  if (campanha) {
    query = query.eq('campaign_slug', campanha);
  }

  const { data: participantes, error: erroParticipantes } = await query;

  if (erroParticipantes) {
    console.error(erroParticipantes);
    return res.status(500).json({ erro: 'Não foi possível consultar participantes' });
  }

  if (!participantes || participantes.length === 0) {
    return res.status(200).json({ participantes: [] });
  }

  // busca a contagem de indicações confirmadas de cada um
  const refCodes = participantes.map(p => p.ref_code);
  const { data: visitas, error: erroVisitas } = await supabase
    .from('referral_visits')
    .select('ref_code')
    .in('ref_code', refCodes)
    .eq('completou_quiz', true);

  if (erroVisitas) {
    console.error(erroVisitas);
    return res.status(500).json({ erro: 'Não foi possível consultar indicações' });
  }

  const contagem = {};
  (visitas || []).forEach(v => {
    contagem[v.ref_code] = (contagem[v.ref_code] || 0) + 1;
  });

  // busca as metas de cada campanha envolvida pra saber quem já bateu
  const { data: campanhas } = await supabase
    .from('campaigns')
    .select('slug, meta_indicacoes, nome_exibicao');

  const metaPorCampanha = {};
  const nomePorCampanha = {};
  (campanhas || []).forEach(c => {
    metaPorCampanha[c.slug] = c.meta_indicacoes;
    nomePorCampanha[c.slug] = c.nome_exibicao;
  });

  const resultado = participantes.map(p => {
    const total = contagem[p.ref_code] || 0;
    const meta = metaPorCampanha[p.campaign_slug] || 3;
    return {
      refCode: p.ref_code,
      nome: p.nome || '(sem nome)',
      whatsapp: p.whatsapp || '(sem whatsapp)',
      campanha: p.campaign_slug,
      campanhaNome: nomePorCampanha[p.campaign_slug] || p.campaign_slug,
      totalIndicacoes: total,
      meta,
      bateuMeta: total >= meta,
      premioNotificado: p.premio_notificado || false,
      criadoEm: p.created_at
    };
  });

  // ordena por quem mais indicou primeiro (ranking)
  resultado.sort((a, b) => b.totalIndicacoes - a.totalIndicacoes);

  return res.status(200).json({ participantes: resultado });
};
