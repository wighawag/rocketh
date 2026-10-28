// deploy/00_admin_stays_external.ts
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async ({addressSignability, namedAccounts, network}) => {
		// a fork rehearsal impersonates the Safe on purpose
		if (network.fork) return;

		const {admin} = namedAccounts;
		if (addressSignability[admin.toLowerCase() as `0x${string}`] !== 'unsignable') {
			throw new Error(`refusing to run: rocketh can sign for ${admin}, which must stay external`);
		}
	},
	{tags: ['Registry', 'Value']},
);
