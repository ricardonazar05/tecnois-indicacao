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

  const { count, error } = await supabase
    .from('referral_visits')
    .select('*', { count: 'exact', head: true })
    .eq('ref_code', refCode)
    .eq('completou_quiz', true);

  if (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Não foi possível consultar' });
  }

  return res.status(200).json({ refCode, totalIndicacoes: count });
};
