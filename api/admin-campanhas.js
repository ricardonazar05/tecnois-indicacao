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

  // GET — lista todas as campanhas (inclusive inativas, pra poder reativar)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      return res.status(500).json({ erro: 'Não foi possível consultar campanhas' });
    }
    return res.status(200).json({ campanhas: data });
  }

  // POST — cria uma campanha nova OU atualiza uma existente (upsert pelo slug)
  if (req.method === 'POST') {
    const {
      slug, nome_exibicao, recompensa_descricao, meta_indicacoes,
      cupom_codigo, cor_primaria, cor_secundaria, ativo
    } = req.body || {};

    if (!slug || !nome_exibicao || !recompensa_descricao) {
      return res.status(400).json({ erro: 'Preencha ao menos slug, nome e recompensa' });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .upsert({
        slug,
        nome_exibicao,
        recompensa_descricao,
        meta_indicacoes: meta_indicacoes || 3,
        cupom_codigo: cupom_codigo || null,
        cor_primaria: cor_primaria || '#0787F0',
        cor_secundaria: cor_secundaria || '#FA770B',
        ativo: ativo !== undefined ? ativo : true
      }, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ erro: 'Não foi possível salvar a campanha' });
    }
    return res.status(200).json({ campanha: data });
  }

  return res.status(405).json({ erro: 'Método não permitido' });
};
