package storage

import "context"

// Note represents a markdown document.
type Note struct {
	Path    string // e.g. "backpropagation.md"
	Title   string // extracted from first # heading or filename
	Content string // raw markdown
}

// Store is the interface for note storage backends.
// Implement this for local filesystem, S3, etc.
type Store interface {
	// List returns all note paths in the store.
	List(ctx context.Context) ([]string, error)

	// Get returns a single note by path.
	Get(ctx context.Context, path string) (*Note, error)

	// Put writes a note. Creates or overwrites.
	Put(ctx context.Context, note *Note) error

	// Delete removes a note by path.
	Delete(ctx context.Context, path string) error
}
