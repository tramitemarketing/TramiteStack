-- =====================================================================
-- T-Stack — Dati demo (schema tstack). Eseguire dopo la migration.
-- I profili degli utenti esistenti vengono seminati separatamente
-- (vedi docs/ISTRUZIONI.md); qui solo clienti/progetti/task/transazioni.
-- =====================================================================

insert into tstack.clients (id, name, contact_email, phone, notes) values
  ('11111111-1111-1111-1111-111111111111', 'Bar Centrale', 'info@barcentrale.it', '+39 333 1112233', 'Cliente storico, social + volantini'),
  ('22222222-2222-2222-2222-222222222222', 'Officina Rossi', 'rossi@officina.it', '+39 333 4445566', 'Sito web + campagna Google Ads')
on conflict (id) do nothing;

insert into tstack.projects (id, client_id, name, description, status, start_date, due_date, budget_amount) values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Social Bar Centrale — Estate', 'Gestione Instagram + 4 grafiche/settimana', 'in_corso', current_date - 10, current_date + 50, 1200.00),
  ('aaaaaaa2-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Nuovo sito Officina Rossi', 'Sito vetrina 5 pagine + SEO base', 'attivo', current_date - 3, current_date + 30, 2500.00)
on conflict (id) do nothing;

insert into tstack.tasks (project_id, title, description, status, priority, due_date, position) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'Piano editoriale luglio', 'Definire 12 post del mese', 'in_corso', 'alta', current_date + 2, 0),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'Grafiche settimana 1', 'Creare 4 post in Canva', 'da_fare', 'media', current_date + 5, 1),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'Wireframe homepage', 'Bozza struttura pagina principale', 'da_fare', 'alta', current_date + 4, 0),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'Raccolta contenuti cliente', 'Foto, testi e logo', 'in_revisione', 'media', current_date + 1, 1)
on conflict do nothing;

insert into tstack.transactions (project_id, type, amount, description, category, occurred_on) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'entrata', 600.00, 'Acconto 50%', 'acconto', current_date - 8),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'uscita', 49.00, 'Abbonamento Canva Pro', 'tools', current_date - 7),
  ('aaaaaaa2-0000-0000-0000-000000000002', 'uscita', 120.00, 'Dominio + hosting annuale', 'hosting', current_date - 2)
on conflict do nothing;
