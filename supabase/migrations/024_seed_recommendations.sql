-- Seed recommendations by category + brand + price-band similarity
insert into recommendations (product_id, related_product_id, score)
select a.id as product_id, b.id as related_product_id,
       (case when a.category_id = b.category_id then 0.5 else 0 end
        + case when a.brand is not distinct from b.brand then 0.3 else 0 end
        + greatest(0, 0.2 - abs(a.price - b.price) / nullif(greatest(a.price, b.price),0)))::numeric(6,3) as score
from products a
cross join products b
where a.id <> b.id
  and a.status = 'active' and b.status = 'active'
  and (a.category_id = b.category_id or a.brand = b.brand)
on conflict do nothing;

-- Prune to top 12 per product
delete from recommendations r
where exists (
  select 1 from (
    select related_product_id, row_number() over (partition by product_id order by score desc) as rn
    from recommendations
    where product_id = r.product_id
  ) t
  where t.related_product_id = r.related_product_id and t.rn > 12
);
