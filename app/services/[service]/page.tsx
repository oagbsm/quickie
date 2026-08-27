import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import ServiceLandingPage from "@/app/components/marketplace/ServiceLandingPage";
import { getService } from "@/app/data/marketplace";

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> { const service = getService((await params).service); return service ? { title: service.seoTitle, description: service.seoDescription } : {}; }
export function generateStaticParams() { return ["cleaning", "gardening", "handyman", "furniture-assembly", "plumbing", "electrical", "removals", "waste-removal", "painting", "tv-mounting", "smart-home", "window-cleaning"].map((service) => ({ service })); }
export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) { const service = getService((await params).service); if (!service) notFound(); return <main className="service-page-content min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><ServiceLandingPage service={service} /></main>; }
