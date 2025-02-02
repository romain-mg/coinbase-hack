export interface WalletStats {
  provider: string;
  address: string;
  network: {
    protocolFamily: string;
    networkId: string;
    chainId: number;
  };
  ethBalance: string;
  balances?: {
    [key: string]: string;
  };
} 