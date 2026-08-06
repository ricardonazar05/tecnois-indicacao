const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  const { refCode } = req.query;

  if (!refCode) {
    return res.status(400).json({ erro: 'Faltou o refCode' });
  }

  // busca o participante (agora inclui se o prêmio já foi notificado)
  const { data: participante, error: erroParticipante } = await supabase
    .from('participants')
    .select('campaign_slug, nome, whatsapp, premio_notificado')
    .eq('ref_code', refCode)
    .single();

  if (erroParticipante || !participante) {
    return res.status(404).json({ erro: 'Código de indicação não encontrado' });
  }

  const { count, error } = await supabase
    .from('referral_visits')
    .select('*', { count: 'exact', head: true })
    .eq('ref_code', refCode)
    .eq('completou_quiz', true);

  if (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Não foi possível consultar' });
  }

  const { data: campanha } = await supabase
    .from('campaigns')
    .select('nome_exibicao, recompensa_descricao, meta_indicacoes, cupom_codigo')
    .eq('slug', participante.campaign_slug)
    .single();

  const meta = campanha?.meta_indicacoes ?? 3;
  const bateuMeta = count >= meta;

  // se bateu a meta AGORA pela primeira vez, avisa a planilha e marca como notificado
  if (bateuMeta && !participante.premio_notificado && process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    try {
      await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: participante.nome,
          whatsapp: participante.whatsapp,
          campanha: campanha?.nome_exibicao,
          totalIndicacoes: count,
          recompensa: campanha?.recompensa_descricao
        })
      });

      await supabase
        .from('participants')
        .update({ premio_notificado: true })
        .eq('ref_code', refCode);
    } catch (e) {
      // se a planilha falhar, não quebra a resposta pro usuário — só loga o erro
      console.error('Falha ao notificar planilha:', e.message);
    }
  }

  return res.status(200).json({
    refCode,
    totalIndicacoes: count,
    metaIndicacoes: meta,
    recompensaDescricao: campanha?.recompensa_descricao ?? '',
    bateuMeta,
    cupomCodigo: bateuMeta ? (campanha?.cupom_codigo ?? null) : null
  });
};
