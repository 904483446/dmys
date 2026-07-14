begin;

select plan(6);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'projects', 'projects table exists');
select has_table('public', 'verification_jobs', 'verification_jobs table exists');
select has_table('public', 'verification_reports', 'verification_reports table exists');
select has_table('public', 'job_artifacts', 'job_artifacts table exists');
select has_function('public', 'claim_verification_job', array['text'], 'claim RPC exists');

select * from finish();

rollback;
