export type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied?: boolean;
};

export type DnsProvider = {
  listRecords(): Promise<DnsRecord[]>;
  createRecord(params: {
    subdomain: string;
    type: string;
    content: string;
    proxied?: boolean;
  }): Promise<{ id: string }>;
  updateRecord(
    recordId: string,
    params: { type?: string; content: string; proxied?: boolean }
  ): Promise<void>;
  deleteRecord(recordId: string): Promise<void>;
};
