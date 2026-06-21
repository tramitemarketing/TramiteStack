-- =====================================================================
-- T-Stack — funzione per creare notifiche anche verso altri utenti.
-- La RLS limita le notifiche al proprietario; questa SECURITY DEFINER
-- consente a un membro di notificare un collega (es. task assegnata).
-- =====================================================================
create or replace function tstack.create_notification(
  p_user_id     uuid,
  p_type        text,
  p_title       text,
  p_body        text default null,
  p_entity_type text default null,
  p_entity_id   uuid default null
) returns void
language sql security definer set search_path = tstack, public as $$
  insert into tstack.notifications (user_id, type, title, body, entity_type, entity_id)
  values (p_user_id, p_type, p_title, p_body, p_entity_type, p_entity_id);
$$;

grant execute on function tstack.create_notification(uuid, text, text, text, text, uuid)
  to authenticated, service_role;
