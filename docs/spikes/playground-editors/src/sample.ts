// The deploy script every page loads, plus a stand-in for rocketh's typed API: a typed deploy
// whose `args` is checked against the artifact's constructor, as the real one does. Line 14 is
// wrong on purpose (a number where the constructor takes a string), so a type-aware editor
// must report exactly one error, on that line.
export const TYPES = `
declare module 'rocketh-sample' {
	export const artifacts: {Greeter: {abi: readonly [{type: 'constructor'; inputs: readonly [{type: 'string'; name: 'initial'}]}]}};
	export function deploy<A extends {abi: readonly unknown[]}>(name: string, o: {account: string; artifact: A; args: A extends {abi: readonly [{type: 'constructor'; inputs: readonly [{type: 'string'}]}]} ? [string] : unknown[]}): Promise<{address: string}>;
}
`;
export const SOURCE = `import {deploy, artifacts} from 'rocketh-sample';

export default async function () {
	const greeter = await deploy('Greeter', {
		account: 'deployer',
		artifact: artifacts.Greeter,
		args: ['hello'],
	});
	console.log(greeter.address);

	await deploy('Greeter2', {
		account: 'deployer',
		artifact: artifacts.Greeter,
		args: [42],
	});
}
`;
export function report(name: string, fields: Record<string, unknown>) {
	(window as unknown as {editorSpike: Record<string, unknown>}).editorSpike = {name, ...fields};
	document.getElementById('status')!.textContent = JSON.stringify({name, ...fields}, null, 2);
}
