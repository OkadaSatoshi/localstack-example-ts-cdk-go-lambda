import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayV2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayV2Integration from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as goLambda from '@aws-cdk/aws-lambda-go-alpha'
// import * as lambda from '@aws-cdk/aws-lambda-go-alpha'
import * as logs from 'aws-cdk-lib/aws-logs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import path = require('path');

export class LocalstackGoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const iamRoleForLambda = new cdk.aws_iam.Role(this, "iamRoleForLambda", {
      roleName: 'localstack-go-lambda-role',
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com")
    })

    const handlerLambda = new goLambda.GoFunction(this, 'HandlerLambda', {
      runtime: lambda.Runtime.PROVIDED_AL2,
      entry: 'cmd/lambda',
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      role: iamRoleForLambda,
      bundling: {
        dockerImage: lambda.Runtime.PROVIDED_AL2.bundlingImage,
        cgoEnabled: false,
        command: [
          'bash', '-c',[
          "export GOCACHE=/tmp/go-cache",
          "export GOPATH=/tmp/go-path",
          "ls -la",
          'GOARCH=amd64 GOOS=linux go build "-ldflags=-s -w" -o /asset-output/bootstrap && cp bootstrap /asset-output/'].join(" && ")
        ],
      }
    })

    const api = new apigateway.RestApi(this, 'TestAPIGateway', {
      disableExecuteApiEndpoint: true,
      deployOptions: {
        // ログ関連の設定
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          // TODO: 既存のロググループ
          logs.LogGroup.fromLogGroupArn(this, 'HandlerLogGroup', 'arn:partition:service:region:account-id:resource-id')
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields()
      }
    })

    api.root.addResource('{proxy+}')
    // NOTE: localstackがAnyをサポートしていないかも
            // .addMethod('ANY', new apigateway.LambdaIntegration(handlerLambda))
            .addMethod('GET', new apigateway.LambdaIntegration(handlerLambda))

    // const handlerLambda = new lambda.Function(this, 'HandlerLambda', {
    //   runtime: lambda.Runtime.PROVIDED_AL2,
    //   handler: 'main.Handler',
    //   timeout: cdk.Duration.seconds(10),
    //   memorySize: 128,
    //   logRetention: logs.RetentionDays.ONE_MONTH,
    //   role: iamRoleForLambda,
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../cmd/lambda'), {
    //     bundling: {
    //       image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
    //       // ビルド用のコマンドとCGO_ENABLED=0の設定について
    //       // serverless上でのbuildProvidedRuntimeAsBootstrap設定をcdkで再現するためのもの。
    //       // provided.al2はlambda関数のパッケージにbootstrap実行ファイルのみを含める必要があるため
    //       command: [
    //         'bash', '-c',[
    //         "export GOCACHE=/tmp/go-cache",
    //         "export GOPATH=/tmp/go-path",
    //         "ls -la",
    //         "go mod tidy",
    //         'GOARCH=amd64 GOOS=linux go build "-ldflags=-s -w" -o /asset-output/bootstrap && cp bootstrap /asset-output/'].join(" && ")
    //       ],
    //       environment: {
    //         'CGO_ENABLED': '0',
    //       }
    //     },
    //   }),
    // })
  }
}
