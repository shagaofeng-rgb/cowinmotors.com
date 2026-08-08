import { CompanyInfoPage, companyPageMetadata } from "@/components/CompanyInfoPage";
export const metadata = companyPageMetadata("payment");
export default function PaymentPage() { return <CompanyInfoPage pageKey="payment" />; }
