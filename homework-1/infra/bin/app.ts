import { App, LegacyStackSynthesizer } from 'aws-cdk-lib';
import { Homework1Stack } from '../lib/homework-1-stack';

const app = new App();

new Homework1Stack(app, 'Homework1', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-north-1',
  },
  synthesizer: new LegacyStackSynthesizer(),
});
