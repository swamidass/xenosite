# Xenosite sitemap helpers
#
# Discovery is manual/rare. Build only expands a committed inventory into
# gitignored gzipped sitemap XML.

NODE ?= node

.PHONY: help sitemap-candidates sitemap-inventory sitemap-inventory-rebuild sitemaps validate-sitemaps clean-sitemaps

help:
	@echo "Sitemap targets:"
	@echo "  make sitemap-candidates          Dry-run drug-like CHEBI name filter (no API)"
	@echo "  make sitemap-inventory           MANUAL: crawl API + write data/sitemap-inventory.json"
	@echo "  make sitemap-inventory-rebuild   Rebuild inventory JSON from checkpoint (no API)"
	@echo "  make sitemaps                    Build public/sitemap/*.xml.gz from inventory (or checkpoint)"
	@echo "  make validate-sitemaps           Check gzip, XML syntax, index URLs, and robots.txt"
	@echo "  make clean-sitemaps              Remove generated gz/index under public/sitemap"

sitemap-candidates:
	$(NODE) scripts/sitemap-candidates.js

sitemap-inventory:
	$(NODE) scripts/sitemap-inventory.js

sitemap-inventory-rebuild:
	$(NODE) scripts/rebuild-inventory-from-checkpoint.js

sitemaps:
	$(NODE) scripts/build-sitemaps-from-inventory.js

validate-sitemaps:
	$(NODE) scripts/validate-sitemaps.js

clean-sitemaps:
	rm -rf public/sitemap
	mkdir -p public/sitemap
	touch public/sitemap/.gitkeep
