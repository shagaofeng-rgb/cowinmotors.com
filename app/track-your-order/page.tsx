import { CompanyInfoPage, companyPageMetadata } from "@/components/CompanyInfoPage";

export const metadata = companyPageMetadata("track-your-order");

export default function TrackYourOrderPage() {
  return <CompanyInfoPage pageKey="track-your-order" />;
}
