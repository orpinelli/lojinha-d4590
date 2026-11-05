-- Dá acesso ao painel /gerenciamento para um usuário do Supabase Auth.
--
-- 1. Crie o usuário em Authentication > Users > Add user > Create new user
--    (e-mail + senha forte, marque "Auto Confirm User").
-- 2. Troque o e-mail abaixo e rode no SQL Editor:

insert into public.admin_users (user_id)
select id
from auth.users
where email = lower('EMAIL-DO-ADMIN@exemplo.com')
on conflict (user_id) do nothing;

-- Para remover um administrador:
-- delete from public.admin_users
-- where user_id = (select id from auth.users where email = lower('EMAIL@exemplo.com'));
