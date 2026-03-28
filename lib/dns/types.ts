export type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied?: boolean;
};

export type CreateRecordParams = {
  subdomain: string;
  type: string;
  content: string;
  proxied?: boolean;
};

export type UpdateRecordParams = {
  type?: string;
  content: string;
  proxied?: boolean;
};

export interface DnsProvider {
  listRecords(): Promise<DnsRecord[]>;
  createRecord(params: CreateRecordParams): Promise<{ id: string }>;
  updateRecord(recordId: string, params: UpdateRecordParams): Promise<void>;
  deleteRecord(recordId: string): Promise<void>;
}

export interface PlatformAdapter {
  verify(
    credentials: Record<string, string>,
    domain: string
  ): Promise<{
    valid: boolean;
    error?: string;
  }>;
  createProvider(
    credentials: Record<string, string>,
    domain: string
  ): DnsProvider;
}
