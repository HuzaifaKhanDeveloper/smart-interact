import { createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { DEALBLOCK_ABI } from "./contract-abi";
import { ERC20_ABI } from "./contract-abi";

export const DEALBLOCK_ADDRESS = "0x85431F91eB780DAec02f2C21fff7a7f9728bc180" as const;

// Optional: set via env `VITE_THIRDWEB_CLIENT_ID`
const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID as string | undefined;

export const thirdwebClient = createThirdwebClient({
  clientId: clientId ?? "", // If empty, thirdweb may require you to supply a clientId at runtime
});

export const activeChain = sepolia;

export function getDealblockContract() {
  return getContract({
    client: thirdwebClient,
    chain: activeChain,
    address: DEALBLOCK_ADDRESS,
    abi: DEALBLOCK_ABI as unknown as any,
  });
}

export function getErc20Contract(address: string) {
  return getContract({
    client: thirdwebClient,
    chain: activeChain,
    address: address as `0x${string}`,
    abi: ERC20_ABI as unknown as any,
  });
}

// Token addresses from contract constants (must match on-chain contract expectations)
export const TOKEN_ADDRESSES = {
  USDC: "0xE3F80d6Bf58794AD8d9d5E3Cb1BC6092b068108a",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
} as const;


