import * as chains from 'viem/chains';

export const chainById: {[chainId: string]: any} = {};
export const allChains: {[chainExportName: string]: any} = {...((chains as any).default || chains)};

export const collisionByIds: {[chainId: string]: any} = {};
for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key];
	const chainId = chain.id.toString();
	if (chainById[chainId]) {
		collisionByIds[chainId] = collisionByIds[chainId] || [chainById[chainId].name];
		collisionByIds[chainId].push(chain.name);
	} else {
		chainById[chainId] = chain;
	}
}

for (const chainId of Object.keys(collisionByIds)) {
	console.log(`${chainId}: `);
	for (const name of collisionByIds[chainId]) {
		console.log(` - ${name}`);
	}
}
