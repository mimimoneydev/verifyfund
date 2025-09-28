"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ActionDialog } from "@/components/ui/action-dialog";
import { Wallet, Info, ShieldCheck } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { useDonateToCampaign } from "../../api/donate-to-campaign";
import { Campaign } from "../../api/get-campaigns";
import { formatUSDC } from "@/lib/utils";
import TrackerButton from "./tracker-button";

interface DonationFormProps {
  campaign: Campaign;
}

const DonationForm = ({ campaign }: DonationFormProps) => {
  const [donationAmount, setDonationAmount] = useState("");
  const [amountFocused, setAmountFocused] = useState(false);
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { mutate: donate, isPending: isDonating } = useDonateToCampaign();



  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({
    title: "",
    description: "",
    txHash: "",
    status: "success" as "success" | "error",
  });

  const isCampaignActive = campaign.status === 0;

  const handleWalletDonate = () => {
    if (!isConnected) {
      // Connect with the first available connector (MetaMask or injected)
      const connector = connectors.find(c => c.name === 'MetaMask') || connectors[0];
      if (connector) {
        connect({ connector });
      }
      return;
    }
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setDialogContent({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        status: "error",
        txHash: "",
      });
      setIsDialogOpen(true);
      return;
    }
    donate(
      { campaignAddress: campaign.address, amount: donationAmount },
      {
        onSuccess: (txHash) => {
          setDialogContent({
            title: "Donation Successful",
            description: "Your donation has been successfully processed.",
            txHash,
            status: "success",
          });
          setIsDialogOpen(true);
          setDonationAmount("");
        },
        onError: (error) => {
          setDialogContent({
            title: "Donation Failed",
            description: error.message,
            status: "error",
            txHash: "",
          });
          setIsDialogOpen(true);
        },
      },
    );
  };



  const isProcessing = isDonating;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-primary" />
            Donate Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCampaignActive ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="amount">Donation Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter donation amount"
                  title="USDC uses approve + donate. Your wallet may first ask to approve the amount, then perform the donation."
                  value={donationAmount}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  disabled={isProcessing}
                />
                {donationAmount && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatUSDC(Number.parseFloat(donationAmount) || 0)}
                  </p>
                )}
                {amountFocused && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> USDC uses approve + donate. Your wallet may first ask to approve the amount, then perform the donation.
                  </p>
                )}
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-foreground mb-2">Select Payment Method:</p>
                <Button
                  className="w-full"
                  onClick={handleWalletDonate}
                  disabled={!donationAmount || isProcessing}
                >
                  {isDonating ? "Processing..." : "Pay with Wallet"}
                </Button>
              </div>
              {false && (
                <div />
              )}
            </>
          ) : (
            <div className="text-center p-4 bg-muted rounded-lg">
              <Info className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Donations are Closed</p>
              <p className="text-sm text-muted-foreground mb-2">
                This campaign is no longer active and is not accepting new donations.
              </p>
              <TrackerButton campaignAddress={campaign.address} />
            </div>
          )}
          {isCampaignActive && (
            <Alert variant={campaign.isOwnerVerified ? "default" : "destructive"}>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>
                {campaign.isOwnerVerified ? "Verified Campaigner" : "Unverified Campaigner"}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {campaign.isOwnerVerified
                  ? "This campaigner is verified. If the campaign target is not met, they can still withdraw the funds, and refunds will not be available to donors."
                  : "This campaigner is not verified. If the campaign target is not met, you will be able to refund your donation."}
              </AlertDescription>
            </Alert>
          )}
          <div className="text-xs text-muted-foreground space-y-1 pt-2">
            <p>• Donations use USDC (ERC-20, 6 decimals).</p>
            <p>• Your wallet may first approve USDC, then donate the amount.</p>
            <p>• Gas fees (if using wallet) are paid with HBAR.</p>
            <p>• Funds go directly to a secure smart contract.</p>
            <p>• 100% transparent and traceable on the blockchain.</p>
          </div>
        </CardContent>
      </Card>
      <ActionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        status={dialogContent.status}
        title={dialogContent.title}
        description={dialogContent.description}
        txHash={dialogContent.txHash}
      />
    </>
  );
};

export default DonationForm;
