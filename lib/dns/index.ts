export type {
  DnsRecord,
  DnsProvider,
  PlatformAdapter,
  CreateRecordParams,
  UpdateRecordParams,
} from "./types";
export { getAdapter, getProvider, isSupported } from "./registry";
