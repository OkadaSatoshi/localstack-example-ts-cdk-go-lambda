FROM golang:1.19-alpine3.17

RUN go install github.com/cosmtrek/air@v1.49.0

# go testの実行にgccとmusl-devが必要
RUN apk update \
  && apk add --no-cache gcc musl-dev

WORKDIR /app

CMD ["air"]
