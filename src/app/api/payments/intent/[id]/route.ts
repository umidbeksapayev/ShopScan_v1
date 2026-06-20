import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// QR to'lov holatini so'rash (klient polling qiladi). RLS a'zolikni ta'minlaydi.
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("payment_intents")
    .select("id, status, finalized")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    finalized: data.finalized,
  });
}
