import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export class DatabaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda accesses Aurora via the RDS Data API (HTTPS), not a direct TCP
    // connection, so Lambda itself never needs to run inside this VPC.
    // Aurora doesn't need outbound internet access either, so the cluster
    // lives in isolated subnets and no NAT gateway is provisioned.
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'aurora-isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // No inbound rules: direct TCP access to Postgres (5432) is not allowed
    // from anywhere. All access goes through the Data API (HTTPS + IAM),
    // which does not traverse this security group.
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: this.vpc,
      description: 'Aurora Serverless v2 cluster - Data API access only, no direct inbound access',
      allowAllOutbound: false,
    });

    this.cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_13,
      }),
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      writer: rds.ClusterInstance.serverlessV2('Writer'),
      serverlessV2MinCapacity: 0,
      serverlessV2MaxCapacity: 1,
      serverlessV2AutoPauseDuration: cdk.Duration.hours(24),
      enableDataApi: true,
      defaultDatabaseName: 'movie_review_exchange',
      credentials: rds.Credentials.fromGeneratedSecret('db_admin'),
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
