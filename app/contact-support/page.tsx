import { CompanyInfoPage, companyPageMetadata } from "@/components/CompanyInfoPage";

export const metadata = companyPageMetadata("contact-support");

export default function ContactSupportPage() {
  return <CompanyInfoPage pageKey="contact-support" />;
}
