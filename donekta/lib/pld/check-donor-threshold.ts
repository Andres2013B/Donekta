import { createClient } from "@supabase/supabase-js";
import { UMBRAL_IDENTIFICACION_MXN, VENTANA_ACUMULACION_MESES } from "./thresholds";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkDonorAccumulation(donorEmail: string) {
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - VENTANA_ACUMULACION_MESES);
  const periodEnd = new Date();

  const { data: donations, error } = await supabase
    .from("donations")
    .select("amount")
    .eq("donor_email", donorEmail)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString());

  if (error) {
    console.error("[PLD] Error consultando donaciones acumuladas:", error);
    return { requiresIdentification: false, error };
  }

  const accumulated = (donations ?? []).reduce(
    (sum, d) => sum + Number(d.amount ?? 0), 0
  );

  if (accumulated < UMBRAL_IDENTIFICACION_MXN) {
    return { requiresIdentification: false, accumulated };
  }

  const { data: identity } = await supabase
    .from("donor_identities")
    .select("id, verified_at")
    .eq("donor_email", donorEmail)
    .maybeSingle();

  if (identity?.verified_at) {
    return { requiresIdentification: false, accumulated, alreadyIdentified: true };
  }

  const { error: upsertError } = await supabase.from("pld_alerts").upsert(
    {
      donor_email: donorEmail,
      accumulated_amount_mxn: accumulated,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      threshold_mxn: UMBRAL_IDENTIFICACION_MXN,
      status: "pending_identification",
    },
    { onConflict: "donor_email,period_start,period_end" }
  );

  if (upsertError) console.error("[PLD] Error creando alerta:", upsertError);

  return { requiresIdentification: true, accumulated };
}
