begin;

-- hashes can't be reversed, drop everything instead of leaving hashes usable as tokens
delete from keibi.sessions;
delete from keibi.apikeys;

commit;
