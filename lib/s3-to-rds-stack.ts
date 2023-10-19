import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class S3ToRdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a new VPC
    const vpc = new ec2.Vpc(this, "VPC", {
      vpcName: "s3-to-rds-vpc",
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: "s3-to-rds-public-subnet-1",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "s3-to-rds-isolated-subnet-1",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    // Create a security group for the ec2 instance (bastion)
    const ec2IstanceSG = new ec2.SecurityGroup(this, "ec2InstanceSG", {
      vpc,
      securityGroupName: "s3-to-rds-bastion-sg",
    });

    ec2IstanceSG.addIngressRule(
      ec2.Peer.ipv4(process.env.IP_SSH_ALLOWED as string),
      ec2.Port.tcp(22),
      "Allow SSH access from my IP"
    );

    // Create the ec2 Instance
    const ec2Instance = new ec2.Instance(this, "ec2Instance", {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2IstanceSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: process.env.KEY_NAME as string,
    });
  }
}
