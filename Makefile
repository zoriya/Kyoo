FFMPEG = transcoder/ffmpeg
CONF_FFMEG = $(FFMPEG)/config.h
FFMPEG_CONF = $(FFMPEG)/configure
FFMPEG_OPT =	--pkg-config-flags=--static \
		--disable-shared \
		--enable-static \
		--disable-asm \
		--disable-zlib \
		--disable-iconv \
		--disable-ffplay \
		--disable-ffprobe \
		--disable-ffmpeg

TRANSCODER_DIR = transcoder/build

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

$(CONF_FFMPEG):
	$(ECHO) "$(COL)Configuring FFMPEG$(NOCOL)"
	$(FFMPEG_CONF) $(FFMPEG_OPT)

ffmpeg: $(CONF_FFMPEG)
	$(ECHO) "$(COL)Building FFMPEG$(NOCOL)"
	$(MAKE) -C $(FFMPEG)

transcoder: ffmpeg
	$(ECHO) "$(COL)Building the transcoder$(NOCOL)"
	mkdir --parent $(TRANSCODER_DIR)
	cd $(TRANSCODER_DIR) && cmake .. && make
	mv $(TRANSCODER_DIR)/libtranscoder.so Kyoo/
	$(ECHO) "$(COL)Transcoder built$(NOCOL)"


install: all
	$(ECHO) "$(COL)Building the app$(NOCOL)"
	@if ! [[ $$(mkdir --parent /opt/kyoo) -eq 0 && -w /opt/kyoo ]]; then echo -e "$(RED)You don't have permissions to install Kyoo. Try to re run with sudo privileges.$(NOCOL)"; exit 1; fi
	dotnet publish -c Release -o /opt/kyoo Kyoo/Kyoo.csproj
	id -u kyoo &> /dev/null || useradd -rU kyoo
	chown -R kyoo /opt/kyoo
	chgrp -R kyoo /opt/kyoo
	chmod +x /opt/kyoo/kyoo.sh

.PHONY = all dependencies ffmpeg transcoder
