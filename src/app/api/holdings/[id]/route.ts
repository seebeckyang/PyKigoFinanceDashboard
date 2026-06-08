import { NextRequest } from "next/server";
import { updateOne, deleteOne } from "@/lib/apiCrud";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return updateOne("holdings", id, req);
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return deleteOne("holdings", id);
}
