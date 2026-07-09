import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DatabaseStack } from '../lib/database-stack';

test('Aurora Serverless v2 cluster has Data API enabled and no public access', () => {
  const app = new cdk.App();
  const stack = new DatabaseStack(app, 'TestDatabaseStack', {
    env: { region: 'ap-northeast-1' },
  });
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::RDS::DBCluster', {
    Engine: 'aurora-postgresql',
    EnableHttpEndpoint: true,
    ServerlessV2ScalingConfiguration: {
      MinCapacity: 0,
      MaxCapacity: 1,
    },
  });

  // CloudFormation omits SecurityGroupIngress entirely when there are no
  // ingress rules, so its absence here is what proves nothing can connect
  // directly to Postgres (5432) - the design intent behind this security group.
  const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
  const dbSecurityGroup = Object.values(securityGroups).find(
    (resource: any) =>
      resource.Properties?.GroupDescription?.includes('Data API access only'),
  ) as any;
  expect(dbSecurityGroup).toBeDefined();
  expect(dbSecurityGroup.Properties.SecurityGroupIngress).toBeUndefined();
});
