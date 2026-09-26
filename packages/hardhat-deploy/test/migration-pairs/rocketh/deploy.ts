// rocketh/deploy.ts
import {setupDeployScripts} from 'rocketh';
import {type Accounts, type Data, type Extensions, extensions} from './config.js';

// A real project re-exports `../generated/artifacts/index.js` here.
import {artifacts} from '../mock-artifacts.js';
export {artifacts};

const {deployScript} = setupDeployScripts<Extensions, Accounts, Data>(extensions);
export {deployScript};
