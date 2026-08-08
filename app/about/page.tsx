import { CompanyInfoPage, companyPageMetadata } from "@/components/CompanyInfoPage";
export const metadata = companyPageMetadata("about");
export default function AboutPage() { return <CompanyInfoPage pageKey="about" />; }
