%define _build_id_links none

Name:		kyoo
Version:	%{version_}
Release:	1%{?dist}
Summary:	A portable and vast media library solution.
URL:		https://github.com/AnonymusRaccoon/Kyoo
License:	GPL-3.0
BuildArch:	x86_64
Requires:	ffmpeg-devel
AutoReqProv:	no

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
