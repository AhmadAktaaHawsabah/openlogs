package openlogsgin

import (
    "fmt"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    openlogssdk "github.com/nextera-one/openlogs-sdk-go"
)

type Location struct {
    Latitude         *float64
    Longitude        *float64
    PlaceCountryCode string
    PlaceCityCode    string
}

type Config struct {
    Enabled  bool
    Actor    string
    NodeName string
    Context  map[string]string
    Location Location
}

type Service struct {
    chain  *openlogssdk.ChainService
    config Config
}

func NewService(cfg Config) *Service {
    return &Service{
        chain:  openlogssdk.NewChainService(),
        config: cfg,
    }
}

func (s *Service) GetChain() []openlogssdk.Record {
    return s.chain.GetChain()
}

func (s *Service) GetLatestHash() string {
    return s.chain.GetLatestHash()
}

func (s *Service) LogHTTPRequest(method, path string, statusCode int, durationMs int64, clientIP, userAgent, errMsg, serverHost string) {
    actor := s.config.Actor
    if actor == "" {
        actor = "client:" + clientIP
    }

    event := "http.request.success"
    if errMsg != "" || statusCode >= 500 {
        event = "http.request.failed"
    }

    data := map[string]interface{}{
        "method":     method,
        "url":        path,
        "statusCode": statusCode,
        "durationMs": durationMs,
        "userAgent":  userAgent,
    }
    if errMsg != "" {
        data["error"] = errMsg
    }

    indexes := map[string]string{
        "method": method,
        "status": fmt.Sprintf("%d", statusCode),
    }

    _, _ = s.chain.Log(openlogssdk.Entry{
        Actor:   actor,
        TPS:     s.buildTPSURI(serverHost),
        Event:   event,
        Data:    data,
        Indexes: indexes,
    })
}

func (s *Service) buildTPSURI(serverHost string) string {
    locationParts := make([]string, 0, 4)

    if s.config.NodeName != "" {
        locationParts = append(locationParts, "node:"+s.config.NodeName)
    } else if serverHost != "" {
        locationParts = append(locationParts, "node:"+serverHost)
    }

    if s.config.Location.Latitude != nil && s.config.Location.Longitude != nil {
        locationParts = append(locationParts, fmt.Sprintf("L:%v,%v", *s.config.Location.Latitude, *s.config.Location.Longitude))

        placeParts := make([]string, 0, 2)
        if s.config.Location.PlaceCountryCode != "" {
            placeParts = append(placeParts, "cc="+s.config.Location.PlaceCountryCode)
        }
        if s.config.Location.PlaceCityCode != "" {
            placeParts = append(placeParts, "ci="+s.config.Location.PlaceCityCode)
        }
        if len(placeParts) > 0 {
            locationParts = append(locationParts, "P:"+strings.Join(placeParts, ","))
        }
    }

    location := "unknown"
    if len(locationParts) > 0 {
        location = strings.Join(locationParts, ";")
    }

    contextFragment := ""
    if len(s.config.Context) > 0 {
        pairs := make([]string, 0, len(s.config.Context))
        for k, v := range s.config.Context {
            pairs = append(pairs, fmt.Sprintf("%s=%s", k, v))
        }
        contextFragment = "#C:" + strings.Join(pairs, ";")
    }

    return fmt.Sprintf("tps://%s@T:unix.%d%s", location, time.Now().Unix(), contextFragment)
}

func AddOpenLogs(engine *gin.Engine, cfg Config) *Service {
    service := NewService(cfg)
    if !cfg.Enabled {
        return service
    }

    engine.Use(func(c *gin.Context) {
        started := time.Now()
        c.Next()

        durationMs := time.Since(started).Milliseconds()
        statusCode := c.Writer.Status()
        errMsg := ""
        if len(c.Errors) > 0 {
            errMsg = c.Errors.Last().Error()
        }

        service.LogHTTPRequest(
            c.Request.Method,
            c.Request.URL.Path,
            statusCode,
            durationMs,
            c.ClientIP(),
            c.GetHeader("User-Agent"),
            errMsg,
            c.Request.Host,
        )
    })

    return service
}
