"use client";

import React from "react";
import { Config, WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { walletConnect, metaMask, injected } from "wagmi/connectors";
import { hederaTestnet } from "viem/chains";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder_project_id";

export const config = createConfig({
  chains: [hederaTestnet],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: walletConnectProjectId,
    }),
    injected(),
  ],
  transports: {
    [hederaTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.hashio.io/api"),
  },
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WagmiProvider>
  );
};
