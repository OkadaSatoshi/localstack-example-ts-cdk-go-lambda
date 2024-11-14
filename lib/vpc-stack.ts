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
export class VpcStack extends cdk.Stack {
    public readonly vpc: ec2.Vpc
    public readonly subnets: ec2.SelectedSubnets
    public readonly securityGroup: ec2.SecurityGroup
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 一旦VPC作ってみる
    const vpc = new ec2.Vpc(this, 'VPC',{
        natGateways: 0,
        subnetConfiguration: [
            {
                cidrMask: 24,
                name: 'Private1',
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            {
                cidrMask: 24,
                name: 'Private2',
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            }
        ],
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        maxAzs: 2
      })
      this.subnets = vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE_ISOLATED})
      

      this.securityGroup = new ec2.SecurityGroup(this, `local-SecurityGroup`, {
        vpc: vpc,
        allowAllOutbound: true
    })
  }
}