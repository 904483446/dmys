begin;

select plan(1);

select has_function(
  'public',
  'create_github_verification_job',
  array['text', 'uuid', 'text', 'text', 'bigint', 'text', 'text'],
  'GitHub job creation RPC exists'
);

select * from finish();

rollback;
