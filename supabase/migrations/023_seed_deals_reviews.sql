-- Flash deals for 8 products (active now, ending in 1-7 days)
with p as (select id, slug from products)
insert into flash_deals (product_id, discount_pct, starts_at, ends_at, max_units)
select p.id, d.discount_pct, now() - interval '6 hours', now() + d.ends_in, d.max_units
from p join (values
  ('jbl-flip-6', 15, interval '2 days', 50),
  ('sony-wf-1000xm4', 20, interval '3 days', 30),
  ('jbl-tune-510bt', 25, interval '1 day', 80),
  ('xiaomi-mi-led-smart-bulb', 15, interval '5 days', 200),
  ('solarmax-garden-light-4-pack', 10, interval '4 days', 100),
  ('anker-powercore-20000-pd', 18, interval '2 days', 60),
  ('xiaomi-yeelight-led-strip-2m', 25, interval '3 days', 100),
  ('xiaomi-mi-smart-plug', 20, interval '1 day', 120)
) as d(slug, discount_pct, ends_in, max_units) on d.slug = p.slug;

-- Seeded reviews (requires at least one profile to exist)
-- If no admin profile exists yet (fresh DB), inserts will skip
insert into reviews (product_id, user_id, rating, title, body, verified_purchase, helpful_count)
select p.id, pr.id, r.rating, r.title, r.body, r.verified, r.helpful
from products p
cross join (select id from profiles order by created_at asc limit 1) pr
join (values
  ('jbl-flip-6', 5, 'Excellent sound!', 'Bass is punchy and battery lasts all day.', true, 14),
  ('jbl-flip-6', 4, 'Solid speaker', 'Great for outdoor use; IP67 is a plus.', false, 6),
  ('sony-wh-1000xm5', 5, 'Industry-leading ANC', 'Noise cancellation is truly next-level.', true, 22),
  ('sony-wh-1000xm5', 5, 'Comfortable for hours', 'Ear cushions are soft; no fatigue.', true, 11),
  ('philips-hue-white-color-e27', 5, 'Just works', 'Hue app is reliable; colors look great.', true, 8),
  ('anker-powercore-20000-pd', 4, 'Chargers my laptop', 'Good for travel. Heavy though.', true, 9),
  ('solarmax-garden-light-4-pack', 4, 'Perfect pathway lights', 'Dim at first but brighten nicely at dusk.', true, 5),
  ('xiaomi-mi-camera-2k', 5, 'Great value', '2K feed is crystal clear.', true, 12),
  ('jbl-charge-5', 5, 'Load loud loud', 'JBL delivered. Stays charged for a weekend.', true, 17),
  ('sandisk-ultra-128gb-microsd', 5, 'Fast and reliable', 'No dropped frames recording 4K phone video.', false, 4)
) as r(slug, rating, title, body, verified, helpful) on r.slug = p.slug
on conflict (product_id, user_id) do nothing;
