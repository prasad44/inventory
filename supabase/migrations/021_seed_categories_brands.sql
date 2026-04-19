-- Top-level categories
insert into categories (name, slug, icon, sort_order) values
('Audio','audio','headphones',1),
('Lighting','lighting','lightbulb',2),
('Solar','solar','sun',3),
('Accessories','accessories','cable',4),
('Smart Home','smart-home','house',5)
on conflict (slug) do nothing;

-- Sub-categories
with parent as (select id, slug from categories)
insert into categories (name, slug, parent_id, icon, sort_order)
select c.name, c.slug, p.id, c.icon, c.sort_order
from (values
  ('Headphones','headphones','audio','headphones',1),
  ('Earbuds & Earphones','earbuds','audio','ear',2),
  ('Bluetooth Speakers','bluetooth-speakers','audio','speaker',3),
  ('Soundbars','soundbars','audio','tv',4),
  ('LED Bulbs','led-bulbs','lighting','lightbulb',1),
  ('LED Strips','led-strips','lighting','waves',2),
  ('Smart Lights','smart-lights','lighting','sparkles',3),
  ('Decorative Lighting','decorative-lighting','lighting','stars',4),
  ('Solar Garden Lights','solar-garden-lights','solar','flower',1),
  ('Solar Panels','solar-panels','solar','square',2),
  ('Solar Power Banks','solar-power-banks','solar','battery-full',3),
  ('Solar Street Lights','solar-street-lights','solar','lamp',4),
  ('Cables & Chargers','cables-chargers','accessories','cable',1),
  ('Power Banks','power-banks','accessories','battery',2),
  ('Cases & Mounts','cases-mounts','accessories','shield',3),
  ('Memory Cards','memory-cards','accessories','database',4),
  ('Smart Plugs','smart-plugs','smart-home','plug',1),
  ('Security Cameras','security-cameras','smart-home','camera',2),
  ('Smart Assistants','smart-assistants','smart-home','mic',3)
) as c(name, slug, parent_slug, icon, sort_order)
join parent p on p.slug = c.parent_slug
on conflict (slug) do nothing;

-- Brands
insert into brands (name, slug, description, is_featured, sort_order) values
('JBL','jbl','Premium audio since 1946. Known for powerful speakers and headphones.',true,1),
('Sony','sony','Japanese electronics giant with industry-leading noise-cancellation.',true,2),
('Philips','philips','Dutch brand. Smart lighting, LED, and home electronics.',true,3),
('Anker','anker','Fast chargers, cables, and power banks trusted worldwide.',true,4),
('Xiaomi','xiaomi','Smart home and connected electronics at excellent value.',true,5),
('Bose','bose','Premium audio with focus on clarity and comfort.',true,6),
('Sennheiser','sennheiser','German audio engineering since 1945.',true,7),
('SolarMax LK','solarmax-lk','Locally-distributed solar products for Sri Lankan homes.',true,8)
on conflict (slug) do nothing;
