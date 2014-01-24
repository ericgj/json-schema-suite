standalone: minify

minify: build.min.js

build.min.js: build.js
	@uglifyjs $< > $@

build.js: components
	@component build --standalone jsonSchema
	@cp build/build.js $@

build: components index.js
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js build.js build.min.js

.PHONY: clean
