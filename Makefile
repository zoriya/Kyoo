FFMPEG = transcoder/ffmpeg
CONFIG = $(FFMPEG)/config.h
OPTIONS =	--pkg-config-flags=--static \
		--disable-shared \
		--enable-static \
		--disable-asm \
		--disable-zlib \
		--disable-iconv \
		--disable-ffplay \
		--disable-ffprobe \
		--disable-ffmpeg

TRANSCODERDIR = transcoder/build

NEEDED = 	dotnet \
		cmake \
		gcc \
		node \
		npm

ECHO = @echo -e
COL = \033[1;36m
RED = \033[1;31m
NOCOL = \033[0m


all: dependencies transcoder

dependencies:
	@for pkg in $(NEEDED); do \
		$$pkg --version >> /dev/null 2>&1 || ($(ECHO) "$(RED)ERROR: $$pkg could not be found.$(NOCOL)"; exit 1); \
	done

$(CONFIG):
	$(ECHO) "$(COL)Configuring FFMPEG$(NOCOL)"
	cd $(FFMPEG) && ./configure $(OPTIONS)

ffmpeg: $(CONFIG)
	$(ECHO) "$(COL)Building FFMPEG$(NOCOL)"
	$(MAKE) -C $(FFMPEG)

transcoder: ffmpeg
	$(ECHO) "$(COL)Building the transcoder$(NOCOL)"
	mkdir --parent $(TRANSCODERDIR)
	cd $(TRANSCODERDIR) && cmake .. && make
	mv $(TRANSCODERDIR)/libtranscoder.so Kyoo/
	$(ECHO) "$(COL)Transcoder built$(NOCOL)"


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

.PHONY = all dependencies ffmpeg transcoder
