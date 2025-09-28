import { useInfiniteQuery } from "@tanstack/react-query";
import { web3Service } from "@/lib/web3";
import { useGetWithdrawalTimestamp } from "./get-withdrawal-timestamp";

export function useGetSpendingHistoryInfinite(campaignAddress?: string, ownerAddress?: string) {
  const { data: withdrawalTimestamp } = useGetWithdrawalTimestamp(campaignAddress);

  return useInfiniteQuery({
    queryKey: ["spending-history-infinite", ownerAddress, campaignAddress],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      web3Service.getSpendingHistoryPage(ownerAddress!, withdrawalTimestamp!, pageParam),
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: !!ownerAddress && withdrawalTimestamp !== null && withdrawalTimestamp !== undefined,
  });
}

