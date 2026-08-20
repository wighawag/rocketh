# @rocketh/doc

Generate documentation from your rocketh deployments. It reads each deployment's ABI and the NatSpec carried in it, builds a structured documentation model (methods, events, errors, parameters, return values), and renders it through [Handlebars](https://handlebarsjs.com) templates.

Because it works from **deployment records** rather than from source, the documentation describes the contracts you actually deployed, at the addresses you deployed them to.

## Installation

```bash
# Using pnpm
pnpm add -D @rocketh/doc

# Using npm
npm install --save-dev @rocketh/doc

# Using yarn
yarn add -D @rocketh/doc
```

`@rocketh/node` is a peer dependency.

## CLI

The package provides the `rocketh-doc` command.

```bash
# generate docs for the mainnet deployments
rocketh-doc -e mainnet -o ./docs/contracts

# skip the generated proxy/implementation records
rocketh-doc -e mainnet -o ./docs/contracts --except-suffix _Implementation _Proxy

# use your own template
rocketh-doc -e mainnet -o ./docs/contracts -t ./my-templates
```

### Options

| Option | Description |
| --- | --- |
| `-e, --environment <value>` | **(Required)** Environment context to use. |
| `-o, --output <value>` | Folder to generate the docs into. |
| `-d, --deployments <value>` | Folder where deployments are saved. |
| `-t, --template <value>` | Template used to generate the docs. |
| `--except-suffix <suffix, suffix...>` | Ignore contracts whose name ends with any of these suffixes. |

`--except-suffix` is the option most projects want straight away: a proxy deployment saves `MyContract_Proxy` and `MyContract_Implementation` next to `MyContract`, and documenting all three says the same thing three times.

## Templates

Templates are Handlebars files. The bundled default lives at `public/default_templates/{{contracts}}.hbs`; a filename containing `{{contracts}}` is expanded once per contract, so one template can produce a page per contract.

Point `-t` at a folder of your own to control the output entirely.

## Programmatic usage

```typescript
import {run, generateFromDeployments, generateDocumentationData} from '@rocketh/doc';
import {readAndResolveConfig} from '@rocketh/node';

const config = await readAndResolveConfig({});

await run(config, 'mainnet', {
	output: './docs/contracts',
	exceptSuffix: ['_Implementation', '_Proxy'],
});
```

| Export | Purpose |
| --- | --- |
| `run(config, environmentName, options)` | Load an environment's deployments from files and generate. |
| `generate({deployments}, options)` | Generate from deployments you already hold. |
| `generateFromDeployments(deployments, options)` | The rendering step, without the filtering. |
| `generateDocumentationData(...)` | Build the documentation **model** only, and render it yourself. |
| `runFromFolder(folder, options)` | Generate from a folder of deployment JSON files, bypassing config. |

`RunOptions` is `{template?: string; output?: string; exceptSuffix?: string[]}`.

### The documentation model

`generateDocumentationData` is the useful one if you are not using Handlebars. It returns a `DocumentationData` structure of `MethodDoc`, `EventDoc`, `ErrorDoc`, `ParamDoc` and `ReturnDoc` entries, each carrying the name, the signature, the raw ABI fragment, a `fullFormat` string, and any NatSpec `notice` / `details` text. Functions additionally carry their `bytes4` selector.

Render it into whatever your site uses.

## NatSpec has to be in the ABI

The documentation text comes from the NatSpec preserved in the artifact your deployment was built from. If your compiler settings drop user/developer documentation, the generated pages will have the right structure with no prose in them. That is a compilation settings problem, not a `@rocketh/doc` one.

## Related packages

- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor
- [`@rocketh/node`](https://www.npmjs.com/package/@rocketh/node) - produces the deployments being documented
- [`@rocketh/export`](https://www.npmjs.com/package/@rocketh/export) - export addresses and ABIs for a frontend
- [`@rocketh/verifier`](https://www.npmjs.com/package/@rocketh/verifier) - publish verified source on block explorers

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
