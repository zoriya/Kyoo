Name:		kyoo
Version:	0.0.1
Release:	1
Summary:	A media browser
URL:		https://github.com/AnonymusRaccoon/Kyoo
License:	GPL-3.0
BuildArch:	x86_64
Requires:	postgresql-server

%description
A media browser

%install
cp -a pkg/. %{buildroot}

%clean
rm -rf %{buildroot}

%files
/usr/lib/kyoo
/usr/lib/systemd/system/*
/usr/lib/sysusers.d/kyoo.conf
/usr/lib/tmpfiles.d/kyoo.conf

%post
sudo -u postgres psql << "EOF"
DO $$
BEGIN
  CREATE ROLE kyoo WITH CREATEDB LOGIN PASSWORD 'kyooPassword';
  EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'not creating role kyoo -- it already exists';
END
$$;
EOF

