PROJECT_NAME = G3W-ADMIN-PANORAMAX

INCLUDE_MAKEFILES_RELEASE = v0.2.0
INCLUDE_MAKEFILES =         Makefile.semver.mk Makefile.venv.mk

install: $(INCLUDE_MAKEFILES)

$(INCLUDE_MAKEFILES):
	wget https://raw.githubusercontent.com/g3w-suite/makefiles/$(INCLUDE_MAKEFILES_RELEASE)/$@
$(foreach i, ${INCLUDE_MAKEFILES}, $(eval include $i))

clean:
	rm $(INCLUDE_MAKEFILES)
