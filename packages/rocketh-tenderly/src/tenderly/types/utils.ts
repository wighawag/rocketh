import {ContractCompiler} from './Contract';

export interface TenderlyKeyConfig {
  access_key: string;
}

export interface BytecodeMismatchError {
  contract_id: string;
  expected: string;
  got: string;
}

export interface TenderlyConfig {
  project: string;
  username: string;
  appendNetworkNameToProject?: boolean;
}

export interface Metadata {
  compiler: ContractCompiler;
  sources: Record<string, MetadataSources>;
}

export interface MetadataSources {
  content: string;
}
