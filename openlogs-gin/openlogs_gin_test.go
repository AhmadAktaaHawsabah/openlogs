package openlogsgin

import (
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
)

func TestMiddlewareLogsSuccessAndError(t *testing.T) {
    gin.SetMode(gin.TestMode)
    router := gin.New()

    service := AddOpenLogs(router, Config{
        Enabled:  true,
        NodeName: "demo-api",
        Context:  map[string]string{"env": "test"},
    })

    router.GET("/", func(c *gin.Context) {
        c.String(http.StatusOK, "Hello OpenLogs API!")
    })
    router.GET("/error", func(c *gin.Context) {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Something went wrong!"})
    })

    w1 := httptest.NewRecorder()
    req1, _ := http.NewRequest(http.MethodGet, "/", nil)
    router.ServeHTTP(w1, req1)

    w2 := httptest.NewRecorder()
    req2, _ := http.NewRequest(http.MethodGet, "/error", nil)
    router.ServeHTTP(w2, req2)

    if w1.Code != http.StatusOK {
        t.Fatalf("expected 200 got %d", w1.Code)
    }
    if w2.Code != http.StatusInternalServerError {
        t.Fatalf("expected 500 got %d", w2.Code)
    }

    chain := service.GetChain()
    if len(chain) < 2 {
        t.Fatalf("expected at least 2 records")
    }

    hasSuccess := false
    hasFailed := false
    for _, r := range chain {
        if r.Entry.Event == "http.request.success" {
            hasSuccess = true
        }
        if r.Entry.Event == "http.request.failed" {
            hasFailed = true
        }
    }

    if !hasSuccess || !hasFailed {
        t.Fatalf("expected both success and failed events")
    }
}
