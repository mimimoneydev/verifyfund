"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target } from "lucide-react";
import { formatUSDC, isArrayLengthGreaterThanZero } from "@/lib/utils";
import CampaignCard from "./campaign-card";
import { Campaign, useGetCampaigns } from "../../api/get-campaigns";
import CampaignsListPageSkeleton from "./campaign-list-skeleton";
import CampaignListError from "./campaign-list-error";
import { CATEGORIES } from "../create-campaign/step-1-basic-info";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "endingSoon", label: "Ending Soon" },
  { value: "mostFunded", label: "Most Funded" },
  { value: "leastFunded", label: "Least Funded" },
];

const categoryOptions = [
  { value: "all", label: "All Categories" },
  ...CATEGORIES.map((category) => ({
    value: category,
    label: category,
  })),
];

export default function CampaignsListPage() {
  const { data: initialCampaigns, isPending, isError } = useGetCampaigns();

  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    sortBy: "latest",
  });

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ status: "all", category: "all", sortBy: "latest" });
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    let campaigns: Campaign[] = [...(initialCampaigns || [])];

    campaigns = campaigns.filter((campaign) => {
      const statusMatch =
        filters.status === "all" ||
        (filters.status === "ongoing" && campaign.status === 0) ||
        (filters.status === "completed" && (campaign.status === 1 || campaign.status === 2));
      const categoryMatch =
        filters.category === "all" ||
        campaign.metadata?.category.toLowerCase() === filters.category.toLowerCase();
      return statusMatch && categoryMatch;
    });

    switch (filters.sortBy) {
      case "endingSoon":
        campaigns.sort((a, b) => a.timeRemaining - b.timeRemaining);
        break;
      case "mostFunded":
        campaigns.sort((a, b) => parseFloat(b.totalRaised) - parseFloat(a.totalRaised));
        break;
      case "leastFunded":
        campaigns.sort((a, b) => parseFloat(a.totalRaised) - parseFloat(b.totalRaised));
        break;
      default:
        break;
    }

    return campaigns;
  }, [initialCampaigns, filters]);

  const stats = useMemo(() => {
    if (!initialCampaigns) {
      return { total: 0, ongoing: 0, completed: 0, totalRaised: 0 };
    }
    return {
      total: initialCampaigns.length,
      ongoing: initialCampaigns.filter((c) => c.status === 0).length,
      completed: initialCampaigns.filter((c) => c.status === 1 || c.status === 2).length,
      totalRaised: initialCampaigns.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0),
    };
  }, [initialCampaigns]);

  if (isPending) {
    return <CampaignsListPageSkeleton />;
  }

  if (isError) {
    return <CampaignListError />;
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">All Campaigns</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Discover and support the campaigns you care about with full transparency
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Campaigns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.ongoing}</div>
              <div className="text-sm text-muted-foreground">Ongoing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{formatUSDC(stats.totalRaised)}</div>
              <div className="text-sm text-muted-foreground">Total Raised</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-muted-foreground">
          Showing {filteredAndSortedCampaigns.length} out of {filteredAndSortedCampaigns.length}{" "}
          campaigns
        </div>

        <div className="flex flex-wrap gap-4">
          <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={(v) => handleFilterChange("category", v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange("sortBy", v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isArrayLengthGreaterThanZero(filteredAndSortedCampaigns) ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredAndSortedCampaigns.map((campaign) => (
            <CampaignCard key={campaign.address} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No campaigns found
          </h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters or sorting options.</p>
          <Button variant="outline" onClick={handleResetFilters}>
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
