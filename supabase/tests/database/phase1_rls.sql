begin;

select plan(5);

select policies_are('public', 'profiles', array['profiles are private']);
select policies_are('public', 'projects', array['projects are private']);
select policies_are('public', 'verification_jobs', array['jobs are private']);
select policies_are('public', 'verification_reports', array['reports are private']);
select policies_are('public', 'job_artifacts', array['artifacts are private']);

select * from finish();

rollback;
