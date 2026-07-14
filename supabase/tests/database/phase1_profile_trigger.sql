begin;

select plan(2);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trigger@example.test', '', now(), '{"provider":"email"}', '{}', now(), now());

select is((select access_status from public.profiles where id = '55555555-5555-5555-5555-555555555555'), 'invited', 'new auth user gets an invited profile');
select is((select count(*) from public.profiles where id = '55555555-5555-5555-5555-555555555555'), 1::bigint, 'profile is created once');

select * from finish();

rollback;
