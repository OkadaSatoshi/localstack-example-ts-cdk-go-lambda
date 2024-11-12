package main

import (
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	// "localstack-go/handler"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"time"
	"context"
	"log"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
)

var ginLambda *ginadapter.GinLambda

func init() {
	// stdout and stderr are sent to AWS CloudWatch Logs
	log.Printf("Gin cold start")

	router := NewRouter()
	ginLambda = ginadapter.New(router.Route())
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// If no name is provided in the HTTP request body, throw an error
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	lambda.Start(Handler)
}


type RouterInterface interface {
	Route() *gin.Engine
}

type Router struct {}

func NewRouter() RouterInterface {
	return &Router{}
}

func (router *Router) Route() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		// wildecard の利用を許可
		AllowWildcard: true,
		// アクセスを許可したいアクセス元
		AllowOrigins: []string{
			"http://localhost:*",
		},
		// アクセスを許可したいHTTPメソッド(以下の例だとPUTやDELETEはアクセスできません)
		AllowMethods: []string{
			"POST",
			"GET",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		// 許可したいHTTPリクエストヘッダ
		AllowHeaders: []string{
			"Access-Control-Allow-Credentials",
			"Access-Control-Allow-Headers",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"Authorization",
			"X-User-Jwt-Session",
			"X-Jwt-Channel-Session",
		},
		// preflightリクエストの結果をキャッシュする時間
		MaxAge: 24 * time.Hour,
	}))

	pingHandler := NewPingHandler()
	{
		r.GET("/ping", pingHandler.Ping())
	}
	return r
}

type PingHandler struct {
}

func NewPingHandler() *PingHandler {
	return &PingHandler{}
}

func (h *PingHandler) Ping() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	}
}