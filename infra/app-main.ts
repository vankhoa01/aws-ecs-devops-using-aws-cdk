#!/usr/bin/env node
import { AppContext, AppContextError } from '../lib/template/app-context';
import { AmplifyStack } from './common-infra/amplify-stack';

import { VpcInfraStack } from './common-infra/vpc-infra-stack';
import { VpcRdsStack } from './common-infra/vpc-rds-stack';
import { EcsAlbServiceStack } from './ecs-service/ecs-alb-service-stack';
import { EcsCommonServiceStack } from './ecs-service/ecs-common-service-stack';


try {
    const appContext = new AppContext({
        appConfigFileKey: 'APP_CONFIG',
    });

    new VpcInfraStack(appContext, appContext.appConfig.Stack.VpcInfra);

    new VpcRdsStack(appContext, appContext.appConfig.Stack.VpcRds);
    new EcsAlbServiceStack(appContext, appContext.appConfig.Stack.AdminPage);
    new AmplifyStack(appContext, appContext.appConfig.Stack.AdminPageAmplify);

    new EcsAlbServiceStack(appContext, appContext.appConfig.Stack.SampleBackendFastapi);
    new EcsAlbServiceStack(appContext, appContext.appConfig.Stack.SampleFrontendFlask);

    new EcsCommonServiceStack(appContext, appContext.appConfig.Stack.LoadTesterScript);
} catch (error) {
    if (error instanceof AppContextError) {
        console.error('[AppContextError]:', error.message);
    } else {
        console.error('[Error]: not-handled-error', error);
    }
}
