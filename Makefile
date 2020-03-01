NEEDED = 	dotnet \
		cmake \
		gcc \
		node \
		npm

ECHO = @echo -e
COL = \033[1;36m
RED = \033[1;31m
NOCOL = \033[0m


all: dependencies

dependencies:
	@for pkg in $(NEEDED); do \
		$$pkg --version >> /dev/null 2>&1 || ($(ECHO) "$(RED)ERROR: $$pkg could not be found.$(NOCOL)"; exit 1); \
	done

install_kyoo: all
	$(ECHO) "$(COL)Building the app$(NOCOL)"
	@if ! [[ $$(mkdir --parent /opt/kyoo) -eq 0 && -w /opt/kyoo ]]; then echo -e "$(RED)You don't have permissions to install Kyoo. Try to re run with sudo privileges.$(NOCOL)"; exit 1; fi
	dotnet publish -c Release -o /opt/kyoo Kyoo/Kyoo.csproj
	id -u kyoo &> /dev/null || useradd -rU kyoo
	chown -R kyoo /opt/kyoo
	chgrp -R kyoo /opt/kyoo
	chmod +x /opt/kyoo/kyoo.sh

install: install_kyoo
	curl https://raw.githubusercontent.com/AnonymusRaccoon/Kyoo.TheTVDB/master/install.sh | sh
	chown -R kyoo /opt/kyoo
	chgrp -R kyoo /opt/kyoo

.PHONY = all dependencies transcoder
