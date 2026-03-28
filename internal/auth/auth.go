package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

// User represents an authenticated GitHub user.
type User struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
}

// ContextKey is the key used to store the user in the request context.
type contextKey struct{}

// Auth holds OAuth config and session store.
type Auth struct {
	oauth *oauth2.Config
	store *sessions.CookieStore
}

// New creates a new Auth from environment variables.
// Required: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
// Optional: SESSION_SECRET (random if unset), OAUTH_REDIRECT_URL (defaults to http://localhost:5001/auth/callback)
func New() *Auth {
	secret := os.Getenv("SESSION_SECRET")
	if secret == "" {
		b := make([]byte, 32)
		rand.Read(b)
		secret = hex.EncodeToString(b)
	}

	redirectURL := os.Getenv("OAUTH_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:5001/auth/callback"
	}

	store := sessions.NewCookieStore([]byte(secret))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 30, // 30 days
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}

	return &Auth{
		oauth: &oauth2.Config{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			RedirectURL:  redirectURL,
			Scopes:       []string{"read:user"},
			Endpoint:     github.Endpoint,
		},
		store: store,
	}
}

// Middleware redirects unauthenticated users to the login page.
func (a *Auth) Middleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Allow auth routes and static files through.
		path := c.Request().URL.Path
		if path == "/login" || path == "/auth/login" || path == "/auth/callback" || path == "/auth/logout" {
			return next(c)
		}
		if len(path) >= 8 && path[:8] == "/static/" {
			return next(c)
		}

		sess, _ := a.store.Get(c.Request(), "session")
		userJSON, ok := sess.Values["user"].(string)
		if !ok {
			return c.Redirect(http.StatusFound, "/login")
		}

		var user User
		if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
			return c.Redirect(http.StatusFound, "/login")
		}

		// Store user in context for handlers/templates.
		ctx := context.WithValue(c.Request().Context(), contextKey{}, &user)
		c.SetRequest(c.Request().WithContext(ctx))
		return next(c)
	}
}

// LoginHandler redirects to GitHub OAuth.
func (a *Auth) LoginHandler(c echo.Context) error {
	state := randomState()
	sess, _ := a.store.Get(c.Request(), "session")
	sess.Values["oauth_state"] = state
	sess.Save(c.Request(), c.Response())

	url := a.oauth.AuthCodeURL(state)
	return c.Redirect(http.StatusFound, url)
}

// CallbackHandler handles the GitHub OAuth callback.
func (a *Auth) CallbackHandler(c echo.Context) error {
	sess, _ := a.store.Get(c.Request(), "session")

	// Verify state.
	expected, _ := sess.Values["oauth_state"].(string)
	if c.QueryParam("state") != expected || expected == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid oauth state")
	}
	delete(sess.Values, "oauth_state")

	// Exchange code for token.
	token, err := a.oauth.Exchange(c.Request().Context(), c.QueryParam("code"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("oauth exchange failed: %v", err))
	}

	// Fetch user info from GitHub API.
	client := a.oauth.Client(c.Request().Context(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user info")
	}
	defer resp.Body.Close()

	var user User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to decode user info")
	}

	// Save user in session.
	userJSON, _ := json.Marshal(user)
	sess.Values["user"] = string(userJSON)
	sess.Save(c.Request(), c.Response())

	return c.Redirect(http.StatusFound, "/")
}

// LogoutHandler clears the session and redirects to login.
func (a *Auth) LogoutHandler(c echo.Context) error {
	sess, _ := a.store.Get(c.Request(), "session")
	sess.Options.MaxAge = -1
	sess.Save(c.Request(), c.Response())
	return c.Redirect(http.StatusFound, "/login")
}

// GetUser returns the authenticated user from the request context, or nil.
func GetUser(c echo.Context) *User {
	user, _ := c.Request().Context().Value(contextKey{}).(*User)
	return user
}

func randomState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
