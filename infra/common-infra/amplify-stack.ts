
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import * as base from '../../lib/template/stack/vpc/vpc-base-stack';
import { Override } from '../../lib/template/stack/base/base-stack';
import { AppContext } from '../../lib/template/app-context';
import { StackConfig } from '../../lib/template/app-config'
import { CfnApp, CfnBranch } from 'aws-cdk-lib/aws-amplify';


export class AmplifyStack extends base.VpcBaseStack {

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
        const amplifyApp = new CfnApp(this, this.stackConfig.AmplifyName, {
            name: this.stackConfig.AmplifyName,
            repository: this.stackConfig.RepositoryURL
        });


        new CfnBranch(this, this.stackConfig.AmplifyBranchName, {
            appId: amplifyApp.attrAppId,
            branchName: this.stackConfig.AmplifyBranchName // you can put any branch here (careful, it will listen to changes on this branch)
        });
    }
}
