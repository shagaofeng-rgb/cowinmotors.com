import { CompanyInfoPage, companyPageMetadata } from "@/components/CompanyInfoPage";

export const metadata = companyPageMetadata("sourcing-bulk-orders");

export default function SourcingBulkOrdersPage() {
  return <CompanyInfoPage pageKey="sourcing-bulk-orders" />;
}
