import {Abi, AbiFunction} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from '@rocketh/core/types';
import type {EIP1193Account} from 'eip-1193';
import {encodeFunctionData, zeroAddress} from 'viem';
import {logs} from 'named-logs';
import {deploy, DeployOptions} from '@rocketh/deploy';
import {checkUpgradeIndex, replaceTemplateArgs, recordDescribesImplementation} from './utils.js';
import ERC1967Proxy from './hardhat-deploy-v1-artifacts/ERC1967Proxy.js';
import ERC173Proxy from './hardhat-deploy-v1-artifacts/EIP173Proxy.js';
import ERC173ProxyWithReceive from './hardhat-deploy-v1-artifacts/EIP173ProxyWithReceive.js';
import TransparentUpgradeableProxy from './hardhat-deploy-v1-artifacts/TransparentUpgradeableProxy.js';
import OptimizedTransparentUpgradeableProxy from './hardhat-deploy-v1-artifacts/OptimizedTransparentUpgradeableProxy.js';
import DefaultProxyAdmin from './hardhat-deploy-v1-artifacts/ProxyAdmin.js';
import {execute, read} from '@rocketh/read-execute';
import {mergeABIs} from '@rocketh/core/artifacts';
import {toJSONCompatibleLinkedData} from '@rocketh/core/json';

const logger = logs('@rocketh/proxy');

/**
 * The EIP-1967 IMPLEMENTATION slot: `bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`.
 *
 * Standardised precisely so that tooling can find a proxy's implementation without the
 * proxy having to expose a getter, which is what we do here — `eth_getStorageAt` on this
 * slot, rather than an `implementation()` call that many proxies deliberately do not have
 * (or hide from the admin). The minus-one is part of the EIP: it makes the slot provably
 * outside the range any Solidity mapping or array can compute, so it cannot collide with
 * the implementation contract's own storage layout.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1967
 */
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;

/**
 * The EIP-1967 ADMIN slot: `bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)`.
 *
 * Read here to find out who may upgrade a proxy, as the fallback for the cases where
 * asking the proxy (an `owner()` / `admin()` call) does not work — a transparent proxy
 * routes non-admin calls to the implementation, so the answer depends on who is asking.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1967
 */
const EIP1967_ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103' as const;

export type {Abi, AbiFunction, Artifact, DeploymentConstruction, Deployment, Environment};

/**
 * `execute` with its per-ABI typing erased, for the one call whose method name is only known
 * at run time (`upgradeFunction`). The runtime path is the same `execute`.
 */
type LooseExecute = (
	deployment: {address: `0x${string}`; abi: Abi},
	args: {account: `0x${string}`; functionName: string; args: unknown[]},
) => Promise<unknown>;

/**
 * Which admin contract a proxy routes its upgrades through, with the defaults applied. See
 * {@link ProxyAdminContractOptions} for why an artifact needs a name.
 */
function resolveAdminContract(
	name: string,
	options: {proxyAdminName?: string; proxyAdminArtifact?: Artifact},
): {proxyAdminName: string; proxyAdminArtifact: Artifact} {
	if (options.proxyAdminArtifact && !options.proxyAdminName) {
		throw new Error(
			`proxyAdminArtifact for ${name} needs a proxyAdminName: without one it would be recorded as DefaultProxyAdmin, and an existing DefaultProxyAdmin would be used instead of your artifact`,
		);
	}
	return {
		proxyAdminName: options.proxyAdminName || 'DefaultProxyAdmin',
		proxyAdminArtifact: options.proxyAdminArtifact || DefaultProxyAdmin,
	};
}

export type PredefinedProxyContract =
	| 'ERC173Proxy'
	| 'ERC173ProxyWithReceive'
	| 'UUPS'
	| 'SharedAdminOpenZeppelinTransparentProxy'
	| 'SharedAdminOptimizedTransparentProxy';

type DeployMutuallyExclusiveOptions = {alwaysOverride?: boolean} | {strictBytecodeMatch?: boolean};

/**
 * The admin CONTRACT that holds upgrade rights over a proxy, for the proxy kinds that route
 * their upgrade through one (the two `SharedAdmin*` transparent proxies, and a `custom`
 * proxy that asks for one).
 *
 * - `proxyAdminName`: the deployment name of the admin. An existing deployment under that
 *   name is used AS-IS (whatever contract it is), which is how you point at an admin you
 *   deployed yourself, a registry contract for instance. For the `SharedAdmin*` kinds it
 *   defaults to `'DefaultProxyAdmin'`; for a `custom` proxy, naming it is what turns the
 *   admin contract on.
 * - `proxyAdminArtifact`: what to deploy under that name when nothing is deployed there
 *   yet, with `[owner]` as constructor arguments (the bundled admin's convention).
 *   Defaults to the bundled `DefaultProxyAdmin`. It REQUIRES `proxyAdminName`: an artifact
 *   recorded under the default name would silently lose to a `DefaultProxyAdmin` another
 *   proxy already deployed.
 *
 * Whichever it is, the admin must answer `owner()`: the upgrade is sent from that owner, and
 * the same refusals apply as for the bundled admin (owner mismatch, owned by no-one).
 */
export type ProxyAdminContractOptions =
	{proxyAdminName?: string; proxyAdminArtifact?: undefined} | {proxyAdminName: string; proxyAdminArtifact: Artifact};

/** The values an `upgradeFunction` argument template can place. */
export type UpgradeArgTemplate = '{proxy}' | '{implementation}' | '{data}' | '{admin}';

const UPGRADE_ARG_PLACEHOLDERS: readonly string[] = [
	'{proxy}',
	'{implementation}',
	'{data}',
	'{admin}',
] satisfies UpgradeArgTemplate[];

export type ProxyDeployOptions = Omit<
	DeployOptions,
	'skipIfAlreadyDeployed' | 'alwaysOverride' | 'strictBytecodeMatch'
> &
	DeployMutuallyExclusiveOptions & {
		proxyDisabled?: boolean;
		owner?: EIP1193Account;
		execute?:
			| string
			| {
					methodName: string;
					args?: any[];
			  }
			| {
					init:
						| string
						| {
								methodName: string;
								args?: any[];
						  };
					onUpgrade?:
						| string
						| {
								methodName: string;
								args?: any[];
						  };
			  };
		upgradeIndex?: number;
		checkProxyAdmin?: boolean;
		checkABIConflict?: boolean;
		deterministicImplementation?: boolean;
		/**
		 * The upgrade call, when it is not one rocketh picks itself (`upgradeTo` /
		 * `upgradeToAndCall` on the proxy, `upgrade` / `upgradeAndCall` on an admin contract).
		 * `methodName` is looked up on the admin contract when the proxy has one, and on the
		 * proxy (its record, which merges the proxy and implementation ABIs) otherwise; the
		 * call is sent from whoever holds upgrade rights, as for the built-in calls. `args` is a
		 * template of placeholders only: `{proxy}`, `{implementation}`, `{data}` (the `execute`
		 * calldata, or `0x`) and `{admin}`.
		 */
		upgradeFunction?: {
			methodName: string;
			args: UpgradeArgTemplate[];
		};
		proxyContract?:
			| PredefinedProxyContract
			| ({
					type: 'SharedAdminOpenZeppelinTransparentProxy' | 'SharedAdminOptimizedTransparentProxy';
			  } & ProxyAdminContractOptions)
			| ({
					type: 'custom';
					artifact: Artifact;
					args?: ('{implementation}' | '{admin}' | '{data}')[]; // default to  ['{implementation}', '{admin}', '{data}']
			  } & ProxyAdminContractOptions);
	};

export type ImplementationDeployer<TAbi extends Abi> = (
	name: string,
	args: Omit<DeploymentConstruction<TAbi>, 'artifact'>,
	options?: DeployOptions,
) => Promise<Deployment<TAbi>>;

// TODO omit nonce ? // TODO omit chain ? same for rocketh-deploy
export type ProxyEnhancedDeploymentConstruction<TAbi extends Abi> = Omit<DeploymentConstruction<TAbi>, 'artifact'> & {
	artifact: Artifact<TAbi> | ImplementationDeployer<TAbi>;
};

export type ProxyEnhancedDeploymentConstructionWithoutFunction<TAbi extends Abi> = Omit<
	DeploymentConstruction<TAbi>,
	'artifact'
> & {
	artifact: Artifact<TAbi>;
};

export type DeployViaProxyFunction = <TAbi extends Abi>(
	name: string,
	params: ProxyEnhancedDeploymentConstruction<TAbi>,
	options?: ProxyDeployOptions,
) => Promise<Deployment<TAbi>>;

export function deployViaProxy(
	env: Environment,
): <TAbi extends Abi>(
	name: string,
	params: ProxyEnhancedDeploymentConstruction<TAbi>,
	options?: ProxyDeployOptions,
) => Promise<Deployment<TAbi>> {
	const _deploy = deploy(env);
	const _read = read(env);
	const _execute = execute(env);
	return async <TAbi extends Abi>(
		name: string,
		params: ProxyEnhancedDeploymentConstruction<TAbi>,
		options?: ProxyDeployOptions,
	) => {
		const alwaysOverride = options && 'alwaysOverride' in options && options.alwaysOverride;
		const strictBytecodeMatch =
			!alwaysOverride && options && 'strictBytecodeMatch' in options && options.strictBytecodeMatch;
		const skipIfAlreadyDeployed = alwaysOverride ? false : true;

		let optionsForImplementation = options
			? {
					strictBytecodeMatch: strictBytecodeMatch,
					alwaysOverride: alwaysOverride,
					deterministic: options.deterministic || options.deterministicImplementation,
					libraries: options.libraries,
				}
			: undefined;
		let optionsForProxy = options
			? ((options) => {
					const {
						owner,
						checkABIConflict,
						checkProxyAdmin,
						execute,
						deterministicImplementation,
						proxyContract,
						proxyDisabled,
						upgradeIndex,
						upgradeFunction,
						linkedData,
						...rest
					} = options;
					return {...rest, strictBytecodeMatch: false}; // strictBytecodeMatch is never applied to proxy
				})(options)
			: undefined;

		const proxyName = `${name}_Proxy`;
		const implementationName = `${name}_Implementation`;

		let existingDeployment = env.getOrNull<TAbi>(name);

		if (options?.proxyDisabled) {
			// WITH NO PROXY, THE DEPLOYMENT IS THE IMPLEMENTATION, so it takes the implementation's
			//  options. It used to take the PROXY's, which decided two things on its behalf that a
			//  proxy needs and a bare contract must not inherit: a forced `skipIfAlreadyDeployed`,
			//  which skipped on NAME alone and silently left a recompiled contract undeployed with
			//  nothing to upgrade it afterwards; and a forced `strictBytecodeMatch: false`, which
			//  is there so a metadata-only diff cannot trigger an UPGRADE, and which here just
			//  discarded the caller's own setting for their own contract. It also dropped
			//  `deterministicImplementation`, which is the only implementation there is.
			if (typeof params.artifact === 'function') {
				return params.artifact(name, params, {
					...optionsForImplementation,
					linkedData: options.linkedData,
				});
			} else {
				return _deploy<TAbi>(name, params as DeploymentConstruction<TAbi>, {
					...optionsForImplementation,
					linkedData: options.linkedData,
				});
			}
		}
		const deployResult = checkUpgradeIndex(existingDeployment, options?.upgradeIndex);
		if (deployResult) {
			return deployResult;
		}

		const {account, artifact, args, ...viemArgs} = params;

		if (!account) {
			throw new Error(`no account specified`);
		}
		const address = env.resolveAccount(account);

		if (options?.upgradeFunction) {
			// Refused up front, before anything is deployed: a typo such as `{implementaton}` would
			//  otherwise reach the chain as a literal string argument.
			const notPlaceholders = options.upgradeFunction.args.filter((arg) => !UPGRADE_ARG_PLACEHOLDERS.includes(arg));
			if (notPlaceholders.length > 0) {
				throw new Error(
					`upgradeFunction.args for ${name} may only contain ${UPGRADE_ARG_PLACEHOLDERS.join(', ')}, got ${notPlaceholders.join(', ')}`,
				);
			}
		}

		let viaAdminContract: {proxyAdminName: string; proxyAdminArtifact: Artifact} | undefined;

		let proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
		let proxyArtifact: Artifact = ERC173Proxy;
		let checkABIConflict: boolean | string[] = ['supportsInterface'];
		let checkProxyAdmin = true;
		if (options?.proxyContract) {
			if (typeof options.proxyContract !== 'string' && options.proxyContract.type === 'custom') {
				proxyArtifact = options.proxyContract.artifact;
				proxyArgsTemplate = options.proxyContract.args || ['{implementation}', '{admin}', '{data}'];
				if (options.proxyContract.proxyAdminName || options.proxyContract.proxyAdminArtifact) {
					viaAdminContract = resolveAdminContract(name, options.proxyContract);
				}
			} else {
				const proxyContractDefinition =
					typeof options.proxyContract === 'string' ? options.proxyContract : options.proxyContract.type;

				switch (proxyContractDefinition) {
					case 'ERC173Proxy':
						proxyArtifact = ERC173Proxy;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						break;
					case 'ERC173ProxyWithReceive':
						proxyArtifact = ERC173ProxyWithReceive;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						break;
					case 'UUPS':
						checkABIConflict = false;
						checkProxyAdmin = false;
						proxyArtifact = ERC1967Proxy;
						proxyArgsTemplate = ['{implementation}', '{data}'];
						break;
					case 'SharedAdminOpenZeppelinTransparentProxy':
						checkABIConflict = false;
						proxyArtifact = TransparentUpgradeableProxy;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						viaAdminContract = resolveAdminContract(
							name,
							typeof options.proxyContract === 'object' ? options.proxyContract : {},
						);
						break;
					case 'SharedAdminOptimizedTransparentProxy':
						checkABIConflict = false;
						proxyArtifact = OptimizedTransparentUpgradeableProxy;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						viaAdminContract = resolveAdminContract(
							name,
							typeof options.proxyContract === 'object' ? options.proxyContract : {},
						);
						break;
					default:
						throw new Error(`unknown proxy contract ${options.proxyContract}`);
				}
			}
		}

		checkABIConflict = options?.checkABIConflict ?? checkABIConflict;
		checkProxyAdmin = options?.checkProxyAdmin ?? checkProxyAdmin;

		const implementationDeployment =
			typeof params.artifact === 'function'
				? await params.artifact(implementationName, {...params}, optionsForImplementation)
				: await _deploy(
						implementationName,
						{
							...viemArgs,
							args,
							artifact,
							account: address,
						} as DeploymentConstruction<TAbi>,
						optionsForImplementation,
					);

		// logger.info(`implementation at ${implementationDeployment.address}`, `${implementationName}`);

		const {
			address: implementationAddress,
			argsData: implementationArgsData,
			transaction,
			newlyDeployed: implementationNewlyDeployed,
			...artifactFromImplementationDeployment
		} = implementationDeployment;

		// TODO throw specific error if artifact not found
		const artifactToUse = artifactFromImplementationDeployment;
		const {mergedABI} = mergeABIs(
			[
				{name: implementationName, abi: artifactFromImplementationDeployment.abi},
				{name: proxyName, abi: proxyArtifact.abi},
			],
			{checkForConflicts: checkABIConflict},
		);

		// logger.info(`existingDeployment at ${existingDeployment?.address}`);

		const expectedOwner = options?.owner || address;
		let proxyAdmin = expectedOwner;

		let proxyAdminContract:
			| {
					deployment: Deployment<Abi>;
					owner: `0x${string}`;
			  }
			| undefined;
		if (viaAdminContract) {
			const proxyAdminOwner = expectedOwner;
			const proxyAdminName = viaAdminContract.proxyAdminName;
			let proxyAdminDeployed: Deployment<Abi> | null = env.getOrNull<Abi>(proxyAdminName);

			if (!proxyAdminDeployed) {
				const proxyAdminDeployment = await _deploy<Abi>(
					proxyAdminName,
					{
						...params,
						artifact: viaAdminContract.proxyAdminArtifact,
						args: [proxyAdminOwner],
					},
					{
						// TODO use optionsForProxy instead ?
						alwaysOverride,
						deterministic: options?.deterministic,
						skipIfAlreadyDeployed,
					},
				);
				proxyAdminDeployed = proxyAdminDeployment;
			}

			// Read through the bundled admin's `owner()` fragment rather than the deployment's own
			//  ABI: any admin, bundled or not, is required to answer it (see ProxyAdminContractOptions).
			const currentProxyAdminOwner = await _read(
				{address: proxyAdminDeployed.address, abi: DefaultProxyAdmin.abi},
				{functionName: 'owner'},
			);

			if (currentProxyAdminOwner.toLowerCase() !== expectedOwner.toLowerCase()) {
				throw new Error(`To change owner/admin, you need to call transferOwnership on ${proxyAdminName}`);
			}
			if (currentProxyAdminOwner === zeroAddress) {
				throw new Error(`The Proxy Admin (${proxyAdminName}) belongs to no-one. The Proxy cannot be upgraded anymore`);
			}
			proxyAdmin = proxyAdminDeployed.address;

			proxyAdminContract = {
				deployment: proxyAdminDeployed,
				owner: currentProxyAdminOwner.toLowerCase() as `0x${string}`,
			};
		}

		let postUpgradeCalldata: `0x${string}` | undefined;
		if (options?.execute) {
			let execution:
				| {
						methodName: string;
						args: any[];
				  }
				| undefined;
			if (typeof options.execute == 'string') {
				execution = {
					methodName: options.execute,
					args: args as any[],
				};
			} else if ('methodName' in options.execute) {
				execution = {
					methodName: options.execute.methodName,
					args: options.execute.args || (args as any[]),
				};
			} else {
				if (existingDeployment) {
					if (typeof options.execute.onUpgrade === 'string') {
						execution = {
							methodName: options.execute.onUpgrade,
							args: args as any[],
						};
					} else if (typeof options.execute.onUpgrade === 'object') {
						execution = {
							methodName: options.execute.onUpgrade.methodName,
							args: options.execute.onUpgrade.args || (args as any[]),
						};
					}
				} else {
					if (typeof options.execute.init === 'string') {
						execution = {
							methodName: options.execute.init,
							args: args as any[],
						};
					} else if (typeof options.execute.init === 'object') {
						execution = {
							methodName: options.execute.init.methodName,
							args: options.execute.init.args || (args as any[]),
						};
					}
				}
			}

			if (execution) {
				const method: AbiFunction | undefined = artifactToUse.abi.find(
					(v) => v.type === 'function' && v.name === execution.methodName,
				) as AbiFunction;
				if (method) {
					postUpgradeCalldata = encodeFunctionData({
						...viemArgs,
						args: execution.args,
						account: address,
						abi: [method],
						functionName: method.name,
					});
				} else {
					throw new Error(`Method ${execution.methodName} not found in artifact provided for ${name}`);
				}
			}
		}
		// let preUpgradeCalldata: `0x${string}` | undefined;
		// if (options?.preExecute) {
		// 	const method: AbiFunction | undefined = artifactToUse.abi.find(
		// 		(v) => v.type === 'function' && v.name === options.preExecute
		// 	) as AbiFunction;
		// 	if (method) {
		// 		preUpgradeCalldata = encodeFunctionData({...viemArgs, account, abi: [method], functionName: method.name});
		// 	}
		// }

		if (!existingDeployment) {
			const {newlyDeployed, ...proxy} = await _deploy<typeof proxyArtifact.abi>(
				proxyName,
				{
					...params,
					artifact: proxyArtifact,
					args: replaceTemplateArgs(proxyArgsTemplate, {
						implementationAddress: implementationDeployment.address,
						proxyAdmin: proxyAdmin,
						data: postUpgradeCalldata ? postUpgradeCalldata : '0x',
					}),
				},
				optionsForProxy,
			);

			// logger.info(`proxy deployed at ${proxy.address}`);

			existingDeployment = await env.save<TAbi>(name, {
				...proxy,
				...artifactToUse,
				abi: mergedABI as unknown as TAbi,
				linkedData: toJSONCompatibleLinkedData(options?.linkedData),
			});

			// logger.info(`saving as ${name}`);
		} else {
			const proxyDeployment = env.getOrNull<typeof proxyArtifact.abi>(proxyName);
			if (!proxyDeployment) {
				throw new Error(`deployment for "${name}" exits but there is no proxy`);
			}

			const implementationSlotData = await env.network.provider.request({
				method: 'eth_getStorageAt',
				params: [proxyDeployment.address, EIP1967_IMPLEMENTATION_SLOT, 'latest'],
			});
			const currentImplementationAddress = `0x${implementationSlotData.substr(-40)}`;

			const upgradeNeeded =
				currentImplementationAddress.toLowerCase() !== implementationDeployment.address.toLowerCase();
			if (upgradeNeeded) {
				// logger.info(
				// 	`different implementation old: ${currentImplementationAddress} new: ${implementationDeployment.address}, upgrade...`,
				// );

				// let currentOwner: `0x${string}` | undefined;
				// try {
				// 	currentOwner = await env.read(proxyDeployment, {functionName: 'owner'});
				// 	console.log({currentOwner});
				// } catch {
				// 	currentOwner = undefined;
				// }
				// if (!currentOwner) {
				const ownerSlotData = await env.network.provider.request({
					method: 'eth_getStorageAt',
					params: [proxyDeployment.address, EIP1967_ADMIN_SLOT, 'latest'],
				});
				let currentOwner = `0x${ownerSlotData.substr(-40)}`;

				if (currentOwner === zeroAddress) {
					// FALLBACK, and the throw is SWALLOWED DELIBERATELY. An empty EIP-1967 admin slot
					//  does not mean "no owner": a proxy may keep its owner somewhere else entirely
					//  (ERC173 stores it in its own slot), so before concluding anything we ASK the
					//  contract. That call legitimately fails for a proxy that has no `owner()` at all,
					//  and "it has no such method" is an ANSWER here, not an error worth surfacing — the
					//  question was only ever "can you tell me your owner?".
					//
					//  Nothing is hidden by swallowing it: `currentOwner` stays the zero address, and the
					//  very next check turns that into either a clear refusal ("The Proxy belongs to
					//  no-one. It cannot be upgraded anymore") or the no-admin path. Logging the RPC
					//  failure would put a scary line in front of every user of an ownerless proxy for a
					//  case the code handles by design.
					try {
						const owner = await _read(existingDeployment as any, {functionName: 'owner'});
						currentOwner = (owner as string).toLowerCase() as `0x${string}`;
					} catch (err) {
						// intentionally ignored — see above; the zero-address check below is the handler
					}
				}

				if (currentOwner === zeroAddress) {
					if (checkProxyAdmin) {
						throw new Error('The Proxy belongs to no-one. It cannot be upgraded anymore');
					}
				} else if (currentOwner.toLowerCase() !== proxyAdmin.toLowerCase()) {
					throw new Error(
						`To change owner/admin, you need to call the proxy directly, it currently is ${currentOwner}`,
					);
				}

				// if (preUpgradeCalldata) {
				// 	if (postUpgradeCalldata) {
				// 		await env.execute(proxyDeployment, {
				// 			account: address,
				// 			functionName: 'callAndUpgradeToAndCall',
				// 			args: [implementation.address, preUpgradeCalldata, postUpgradeCalldata],
				// 			value: 0n, // TODO
				// 		});
				// 	} else {
				// 		await env.execute(proxyDeployment, {
				// 			account: address,
				// 			functionName: 'callAndUpgradeToAndCall',
				// 			args: [implementation.address, preUpgradeCalldata, '0x'],
				// 			value: 0n, // TODO
				// 		});
				// 	}
				// } else

				const deploymentToUseForUpgrade = options?.proxyContract === 'UUPS' ? existingDeployment : proxyDeployment;

				let useUpgradeToAndCall = !!postUpgradeCalldata;
				if (!useUpgradeToAndCall) {
					if (!deploymentToUseForUpgrade.abi.find((v) => v.type === 'function' && v.name === 'upgradeTo')) {
						useUpgradeToAndCall = true;
					}
				}

				if (options?.upgradeFunction) {
					// The caller's own upgrade call. Same target and same sender as the built-in
					//  calls below: the admin contract from its owner when there is one, the proxy
					//  from its owner otherwise. The proxy is addressed through its RECORD
					//  (`existingDeployment`), whose ABI merges the proxy's and the implementation's,
					//  so the method may live on either (v1 did the same).
					const {methodName, args: upgradeArgsTemplate} = options.upgradeFunction;
					const target: Deployment<Abi> = proxyAdminContract
						? proxyAdminContract.deployment
						: (existingDeployment as unknown as Deployment<Abi>);
					const targetName = proxyAdminContract ? viaAdminContract!.proxyAdminName : name;
					if (!target.abi.some((v) => v.type === 'function' && v.name === methodName)) {
						throw new Error(
							`upgradeFunction.methodName "${methodName}" is not a function of ${targetName}, so ${name} cannot be upgraded through it`,
						);
					}
					if (postUpgradeCalldata && !upgradeArgsTemplate.includes('{data}')) {
						throw new Error(
							`execute produced calldata to run with the upgrade of ${name}, but upgradeFunction.args has no '{data}' to carry it`,
						);
					}
					await (_execute as unknown as LooseExecute)(target, {
						account: proxyAdminContract ? proxyAdminContract.owner : (currentOwner as `0x${string}`),
						functionName: methodName,
						args: replaceTemplateArgs(upgradeArgsTemplate, {
							implementationAddress: implementationDeployment.address,
							proxyAdmin,
							data: postUpgradeCalldata || '0x',
							proxyAddress: proxyDeployment.address,
						}),
					});
				} else if (proxyAdminContract) {
					const proxyAdminDeployment = proxyAdminContract.deployment as unknown as Deployment<
						typeof DefaultProxyAdmin.abi
					>;
					if (useUpgradeToAndCall) {
						await _execute(proxyAdminDeployment, {
							account: proxyAdminContract.owner,
							functionName: 'upgradeAndCall',
							args: [proxyDeployment.address, implementationDeployment.address, postUpgradeCalldata || '0x'],
							value: 0n, // TODO
						});
					} else {
						await _execute(proxyAdminDeployment, {
							account: proxyAdminContract.owner,
							functionName: 'upgrade',
							args: [proxyDeployment.address, implementationDeployment.address],
						});
					}
				} else {
					if (useUpgradeToAndCall) {
						await _execute(deploymentToUseForUpgrade, {
							account: currentOwner,
							functionName: 'upgradeToAndCall',
							args: [implementationDeployment.address, postUpgradeCalldata || '0x'],
							value: 0n, // TODO
						});
					} else {
						await _execute(deploymentToUseForUpgrade, {
							account: currentOwner,
							functionName: 'upgradeTo',
							args: [implementationDeployment.address],
						});
					}
				}
			}

			// The record describes the CHAIN, not this run, so it is written whenever the two
			//  agree, however they came to. See `Environment.save` in `@rocketh/core` for the
			//  counter rule and `recordDescribesImplementation` for what "agree" compares.
			//
			//  `upgradeNeeded ||` is the part that is specific to this call site and must not be
			//  folded into the guard: an upgrade this run performed always saves, because two
			//  implementations can differ while their ABIs are identical and skipping the save
			//  there would freeze `numDeployments`, which `upgradeIndex` reads.
			if (upgradeNeeded || !recordDescribesImplementation(existingDeployment, mergedABI, artifactToUse)) {
				existingDeployment = await env.save<TAbi>(name, {
					...proxyDeployment,
					...artifactToUse,
					abi: mergedABI as unknown as TAbi,
					linkedData: toJSONCompatibleLinkedData(options?.linkedData),
				});
				// logger.info(`saving as ${name}`);
			}
		}
		return existingDeployment;
	};
}
