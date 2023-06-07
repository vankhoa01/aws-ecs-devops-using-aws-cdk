
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

import * as base from '../../lib/template/stack/vpc/vpc-base-stack';
import { Override } from '../../lib/template/stack/base/base-stack';
import { AppContext } from '../../lib/template/app-context';
import { StackConfig } from '../../lib/template/app-config'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';


export class VpcRdsStack extends base.VpcBaseStack {

    constructor(appContext: AppContext, stackConfig: StackConfig) {
        super(appContext, stackConfig);
    }

    @Override
    onLookupLegacyVpc(): base.VpcLegacyLookupProps | undefined {
        return {
            vpcNameLegacy: this.getVariable('VpcName')
        };
    }

    @Override
    onPostConstructor(baseVpc?: ec2.IVpc) {
        const engine = rds.DatabaseInstanceEngine.postgres({
            version: rds.PostgresEngineVersion.VER_14_3
        });
        const instanceType = ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO);
        const port = 5432;
        const dbName = this.stackConfig.DatabaseName;

        // Create master user detail secret
        const masterUserSecret = new Secret(this, 'db-master-user-secret', {
            secretName: "db-master-user-secret",
            description: "Master user secret for database",
            generateSecretString: {
                secretStringTemplate: JSON.stringify({
                    username: "postgres",
                }),
                generateStringKey: 'password',
                passwordLength: 16,
                excludePunctuation: true,
            },
        });

        // We know this VPC already exists, so we can use it to create the security group
        const myVPC = ec2.Vpc.fromLookup(this, baseVpc!.vpcId, {
            vpcId: baseVpc!.vpcId,
        });

        // Create a Security group for the database
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'db-security-group', {
            vpc: myVPC,
            securityGroupName: 'db-security-group',
            description: 'Security group for database',
        });
        // Add Inbound rule for the database
        dbSecurityGroup.addIngressRule(ec2.Peer.ipv4(baseVpc!.vpcCidrBlock), ec2.Port.tcp(port), 'Allow access from within VPC');

        // Create RDS instance (Postgres)
        const dbInstance = new rds.DatabaseInstance(this, 'db-instance', {
            engine,
            instanceType,
            vpc: baseVpc!,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            securityGroups: [dbSecurityGroup],
            databaseName: dbName,
            port,
            credentials: {
                username: 'postgres',
                password: cdk.SecretValue.secretsManager(masterUserSecret.secretArn, { jsonField: 'password' }),
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });


        // new cdk.CfnOutput(this, 'dbEndpoint', {
        //     value: dbInstance.instanceEndpoint.hostname,
        // });

        // new cdk.CfnOutput(this, 'secretName', {
        //     // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        //     value: dbInstance.secret?.secretName!,
        // });
    }
}
