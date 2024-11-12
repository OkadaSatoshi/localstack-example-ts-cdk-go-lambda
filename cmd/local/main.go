package main

import (
	"localstack-go/handler"
)


func main() {
	r := handler.NewRouter()
	r.Route().Run(":4000")
}
