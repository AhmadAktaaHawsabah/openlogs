package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
    openlogsgin "github.com/nextera-one/openlogs-gin"
)

func main() {
    router := gin.Default()

    service := openlogsgin.AddOpenLogs(router, openlogsgin.Config{
        Enabled:  true,
        NodeName: "demo-api",
        Context: map[string]string{
            "env": "demo",
        },
    })

    router.GET("/", func(c *gin.Context) {
        c.String(http.StatusOK, "Hello OpenLogs API!")
    })

    router.GET("/error", func(c *gin.Context) {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Something went wrong!"})
    })

    router.GET("/chain", func(c *gin.Context) {
        c.JSON(http.StatusOK, service.GetChain())
    })

    _ = router.Run(":8080")
}
