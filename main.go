package main

import (
	"log"
	"net/http"
	"strings"

	"github.com/a-h/templ"
	"github.com/c3d4r/b4se-browser/internal/storage"
	"github.com/c3d4r/b4se-browser/templates"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	store := storage.NewLocal("content")

	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Static files — serve with proper cache control
	fs := http.FileServer(http.Dir("static"))
	e.GET("/static/*", func(c echo.Context) error {
		if strings.Contains(c.Request().URL.RawQuery, "v=") {
			c.Response().Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			c.Response().Header().Set("Cache-Control", "no-cache, must-revalidate")
		}
		http.StripPrefix("/static/", fs).ServeHTTP(c.Response(), c.Request())
		return nil
	})

	// Page routes
	e.GET("/", func(c echo.Context) error {
		paths, err := store.List(c.Request().Context())
		if err != nil {
			return err
		}
		// Load first note as default
		var notes []templates.NoteEntry
		var activeNote *storage.Note
		for _, p := range paths {
			n, err := store.Get(c.Request().Context(), p)
			if err != nil {
				continue
			}
			notes = append(notes, templates.NoteEntry{Path: p, Title: n.Title})
			if activeNote == nil {
				activeNote = n
			}
		}
		if activeNote == nil {
			activeNote = &storage.Note{Path: "empty", Title: "No Notes", Content: "# No Notes\n\nAdd markdown files to the `content/` directory."}
		}
		return render(c, http.StatusOK, templates.Page(notes, activeNote.Path, activeNote.Title, activeNote.Content))
	})

	// HTMX: load a note's content
	e.GET("/notes/:path", func(c echo.Context) error {
		path := c.Param("path")
		note, err := store.Get(c.Request().Context(), path)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound, "note not found")
		}
		return render(c, http.StatusOK, templates.NoteContent(note.Title, note.Content))
	})

	// HTMX: list notes (for search/refresh)
	e.GET("/notes", func(c echo.Context) error {
		paths, err := store.List(c.Request().Context())
		if err != nil {
			return err
		}
		var notes []templates.NoteEntry
		for _, p := range paths {
			n, err := store.Get(c.Request().Context(), p)
			if err != nil {
				continue
			}
			notes = append(notes, templates.NoteEntry{Path: p, Title: n.Title})
		}
		return render(c, http.StatusOK, templates.NoteList(notes, ""))
	})

	log.Println("Starting server on :5001")
	e.Logger.Fatal(e.Start(":5001"))
}

func render(c echo.Context, status int, t templ.Component) error {
	c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextHTMLCharsetUTF8)
	c.Response().WriteHeader(status)
	return t.Render(c.Request().Context(), c.Response())
}
