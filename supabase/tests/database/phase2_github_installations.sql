begin;

select plan(3);

select has_table('public', 'github_installations', 'GitHub installations table exists');
select col_type_is('public', 'github_installations', 'encrypted_token', 'bytea', 'encrypted token column is binary');
select policies_are('public', 'github_installations', array['github installations are private']);

select * from finish();

rollback;
