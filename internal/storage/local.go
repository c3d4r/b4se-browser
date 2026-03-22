package storage

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var titleRe = regexp.MustCompile(`(?m)^#\s+(.+)`)

// Local implements Store using the local filesystem.
type Local struct {
	Dir string // root directory for markdown files
}

func NewLocal(dir string) *Local {
	return &Local{Dir: dir}
}

func (l *Local) List(ctx context.Context) ([]string, error) {
	entries, err := os.ReadDir(l.Dir)
	if err != nil {
		return nil, fmt.Errorf("list notes: %w", err)
	}
	var paths []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".md") {
			paths = append(paths, e.Name())
		}
	}
	return paths, nil
}

func (l *Local) Get(ctx context.Context, path string) (*Note, error) {
	data, err := os.ReadFile(filepath.Join(l.Dir, path))
	if err != nil {
		return nil, fmt.Errorf("get note %q: %w", path, err)
	}
	content := string(data)
	title := titleFromContent(content, path)
	return &Note{
		Path:    path,
		Title:   title,
		Content: content,
	}, nil
}

func (l *Local) Put(ctx context.Context, note *Note) error {
	return os.WriteFile(filepath.Join(l.Dir, note.Path), []byte(note.Content), 0644)
}

func (l *Local) Delete(ctx context.Context, path string) error {
	return os.Remove(filepath.Join(l.Dir, path))
}

func titleFromContent(content, fallback string) string {
	m := titleRe.FindStringSubmatch(content)
	if m != nil {
		return m[1]
	}
	return strings.TrimSuffix(fallback, ".md")
}
