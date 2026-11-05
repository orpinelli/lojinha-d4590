-- Conteúdo inicial (o mesmo que estava fixo no código). Idempotente.

insert into public.categories (id, name, position) values
  ('vestuario', 'Vestuário', 0),
  ('acessorios', 'Acessórios', 1),
  ('combos', 'Combos', 2)
on conflict (id) do nothing;

insert into public.products
  (id, category_id, name, description, price_in_cents, images, sizes,
   details_title, details_items, featured, active, position)
values
  ('11', 'vestuario', 'Camiseta preta',
   'Camiseta preta 100% algodão, confortável e versátil para o dia a dia.',
   6000, array['/produtos/camisetas/camiseta-preta.png'],
   array['PP', 'P', 'M', 'G', 'GG', 'XG'],
   'Descrição do Produto', array['Tecido: 100% algodão', 'Modelagem unissex'],
   false, true, 0),
  ('12', 'vestuario', 'Camiseta rosa',
   'Camiseta rosa 100% algodão, confortável e versátil para o dia a dia.',
   6000, array['/produtos/camisetas/camiseta-rosa.png'],
   array['PP', 'P', 'M', 'G', 'GG', 'XG'],
   'Descrição do Produto', array['Tecido: 100% algodão', 'Modelagem unissex'],
   true, true, 1),
  ('1', 'acessorios', 'Caneca 850mL',
   'Caneca 850mL em material resistente, ideal para uso diário. Acabamento brilhante e impressão de alta definição.',
   2500, array['/produtos/caneca.jpg'], array[]::text[],
   'Descrição do Produto',
   array['Capacidade: 850mL', 'Acabamento brilhante', 'Impressão durável'],
   false, true, 0),
  ('4', 'acessorios', 'Pin',
   'Tirante 25mm com mosquetão metálico. Confortável para crachá, chaves e eventos.',
   1500, array['/produtos/pin.png'], array[]::text[],
   'Descrição do Produto',
   array['Largura: 25mm', 'Comprimento total: ~90cm', 'Mosquetão metálico'],
   false, true, 1),
  ('5', 'acessorios', 'Tirante',
   'Tirante 25mm com mosquetão metálico. Confortável para crachá, chaves e eventos.',
   1200, array['/produtos/tirante.jpg'], array[]::text[],
   'Descrição do Produto', array['Mosquetão metálico'],
   false, true, 2),
  ('6', 'acessorios', 'Adesivos vinil 5x5cm',
   'Adesivos em vinil 5x5cm com recorte preciso e resistência à água e à luz.',
   200, array['/produtos/adesivos/19.png'], array[]::text[],
   'Descrição do Produto',
   array['Tamanho: 5x5cm', 'Vinil resistente à água', 'Adesivo de alta fixação'],
   false, false, 3),
  ('8', 'combos', 'Caneca + tirante',
   'Kit com Caneca e tirante. Presente funcional e versátil.',
   3000,
   array['/kit/kit-caneca-tirante.jpeg', '/produtos/caneca.jpg', '/produtos/tirante.jpg'],
   array[]::text[],
   'O Kit Inclui', array['1x Caneca', '1x Tirante'],
   false, true, 0),
  ('9', 'combos', 'Caneca + Tirante + Pin',
   'Kit com Caneca, tirante e pin para máxima capacidade e praticidade.',
   4200,
   array['/kit/kit1.png', '/produtos/caneca.jpg', '/produtos/pin.png', '/produtos/tirante.jpg'],
   array[]::text[],
   'O Kit Inclui', array['1x Caneca', '1x Tirante', '1x Pin'],
   false, true, 1),
  ('10', 'combos', 'Camiseta + Caneca + Tirante + Pin',
   'Kit com Camiseta rosa ou preta, Caneca, tirante e pin.',
   8990,
   array['/kit/kit-completo.jpeg', '/produtos/caneca.jpg', '/produtos/tirante.jpg',
         '/produtos/pin.png', '/produtos/camisetas/camiseta-rosa.png',
         '/produtos/camisetas/camiseta-preta.png'],
   array['PP', 'P', 'M', 'G', 'GG', 'XG'],
   'O Kit Inclui',
   array['1x Camiseta Rosa ou Preta', '1x Caneca', '1x Tirante', '1x Pin'],
   false, true, 2)
on conflict (id) do nothing;

insert into public.site_settings (section, data) values
  ('branding', '{
    "storeName": "Loja D4590",
    "description": "Loja de produtos do Distrito D4590",
    "logoUrl": "/rotaract-logo.png",
    "faviconUrl": "/logo.png",
    "invertFooterLogo": true
  }'::jsonb),
  ('theme', '{
    "primary": "#d41367",
    "primaryForeground": "#ffffff",
    "background": "#ffffff",
    "foreground": "#000000",
    "mutedForeground": "#4b5563",
    "footerBackground": "#000000",
    "footerForeground": "#ffffff"
  }'::jsonb),
  ('hero', '{
    "title": "ROTARACT",
    "highlight": "DISTRITO 4590",
    "subtitle": "Uma coleção exclusiva que celebra a excelência e o compromisso com o serviço."
  }'::jsonb),
  ('labels', '{ "featured": "Mais Vendido", "shipping": "Frete Grátis" }'::jsonb),
  ('contact', '{
    "whatsappNumber": "5519991801697",
    "orderGreeting": "Olá! Gostaria de fazer o seguinte pedido:",
    "instagramUrl": "https://www.instagram.com/rotaract4590/"
  }'::jsonb),
  ('footer', '{ "copyright": "© 2025 ROTARACT DISTRITO 4590. TODOS OS DIREITOS RESERVADOS." }'::jsonb)
on conflict (section) do nothing;
