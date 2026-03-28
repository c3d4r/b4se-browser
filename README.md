# b4se-browser

A markdown knowledge base browser with sidebar navigation, chat, toast notifications, and preview UI. Built with Go/Echo/Templ on the backend and Tailwind/HTMX on the frontend.

## Stack

- **Backend:** Go, [Echo](https://echo.labstack.com/), [Templ](https://templ.guide/)
- **Frontend:** Tailwind CSS, HTMX, Lucide icons, Marked (markdown), KaTeX (math)
- **Testing:** Playwright

## Project structure

```
content/          Markdown files (knowledge base entries)
internal/storage/ Storage layer for reading/listing pages
templates/        Templ templates (layout + page)
static/           JS and CSS assets
```

## Getting started

```bash
# Install Go dependencies
go mod download

# Generate templ files and run the server
make dev

# Or build and run
make build
./b4se-browser
```

The server starts on port **5001**.

## Testing

```bash
npx playwright test
```
