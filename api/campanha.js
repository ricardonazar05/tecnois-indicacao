const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ erro: 'Faltou o slug da campanha' });
  }

  const { data, error } = await supabase
    .from('campaigns')
    .select('slug, nome_exibicao, recompensa_descricao, meta_indicacoes, cor_primaria, cor_secundaria')
    .eq('slug', slug)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return res.status(404).json({ erro: 'Campanha não encontrada ou inativa' });
  }

  return res.status(200).json(data);
};
