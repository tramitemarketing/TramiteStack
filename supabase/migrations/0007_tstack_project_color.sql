-- =====================================================================
-- T-Stack — colore identità per ogni progetto (etichetta task + header dettaglio).
-- =====================================================================
alter table tstack.projects add column if not exists color text;

-- Backfill: colori distinti (ciclo su palette) per i progetti senza colore.
update tstack.projects p
set color = palette.c[((r.rn) % 9) + 1]
from (
  select id, (row_number() over (order by created_at) - 1) as rn
  from tstack.projects
  where color is null
) r,
(select array['#0F4C81','#0E7C86','#1F8A5B','#2A78C2','#7C5CD6','#B4458E','#D8553F','#C8932B','#5A6473'] as c) palette
where p.id = r.id;
