begin;

update keibi.sessions set token = encode(sha256(convert_to(token, 'UTF8')), 'hex');
update keibi.apikeys set token = encode(sha256(convert_to(token, 'UTF8')), 'hex');

commit;
