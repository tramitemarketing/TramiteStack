-- =====================================================================
-- T-Stack — abilita Realtime sulle tabelle condivise (la RLS resta valida).
-- =====================================================================
do $$
declare
  t text;
begin
  foreach t in array array['tasks', 'transactions', 'calendar_events', 'projects'] loop
    begin
      execute format('alter publication supabase_realtime add table tstack.%I', t);
    exception when others then
      -- già presente nella publication: ignora
      null;
    end;
  end loop;
end $$;
