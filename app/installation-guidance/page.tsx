import { CompanyInfoPage, companyPageMetadata } from "@/components/CompanyInfoPage";

export const metadata = companyPageMetadata("installation-guidance");

export default function InstallationGuidancePage() {
  return <CompanyInfoPage pageKey="installation-guidance" />;
}
