import { NextRequest } from "next/server";
import { listAll, createOne } from "@/lib/apiCrud";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return listAll("subscriptions"); }
export async function POST(req: NextRequest) { return createOne("subscriptions", req); }
