import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CfnOutput, Stack, StackProps, Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class Homework1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true });

    const securityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Public HTTP access',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP from anywhere');

    const role = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
    });

    const compose = readFileSync(join(__dirname, '..', '..', 'compose.yaml'), 'utf8').trimEnd();

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'export DEBIAN_FRONTEND=noninteractive',
      'apt-get update -y',
      'apt-get install -y docker.io docker-compose-v2',
      'systemctl enable --now docker',
      'mkdir -p /opt/homework-1',
      `cat > /opt/homework-1/compose.yaml <<'COMPOSE'\n${compose}\nCOMPOSE`,
      'docker compose -f /opt/homework-1/compose.yaml up -d',
    );

    const instance = new ec2.Instance(this, 'Instance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.fromSsmParameter(
        '/aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id',
        { os: ec2.OperatingSystemType.LINUX },
      ),
      securityGroup,
      role,
      userData,
      userDataCausesReplacement: true,
      requireImdsv2: true,
      associatePublicIpAddress: true,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    Tags.of(this).add('Project', 'cloud-computing');
    Tags.of(this).add('Homework', '1');

    new CfnOutput(this, 'Url', { value: `http://${instance.instancePublicIp}` });
    new CfnOutput(this, 'InstanceId', { value: instance.instanceId });
  }
}
