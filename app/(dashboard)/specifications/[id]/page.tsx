import type { ApiResponse, Specification } from "@/types";
import { SpecificationDetailView } from "@/components/specifications/specification-detail-view";

export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      return [];
    }
    const url = `${base.replace(/\/$/, "")}/specifications?page=1&pageSize=12`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as ApiResponse<Specification[]>;
    if (!Array.isArray(body.data)) {
      return [];
    }
    return body.data.map((item) => ({ id: item.id }));
  } catch {
    return [];
  }
}

interface SpecificationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpecificationDetailPage({ params }: SpecificationDetailPageProps) {
  const { id } = await params;
  return <SpecificationDetailView specId={id} />;
}
