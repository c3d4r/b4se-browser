.PHONY: generate build run dev clean

TEMPL := $(shell which templ 2>/dev/null || echo "/.sprite/languages/go/workspace/bin/templ")

generate:
	$(TEMPL) generate

build: generate
	go build -o b4se-browser .

run: build
	./b4se-browser

dev:
	$(TEMPL) generate --watch &
	go run .

clean:
	rm -f b4se-browser
	rm -f templates/*_templ.go
