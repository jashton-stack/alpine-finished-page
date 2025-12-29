// src/App.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { setThemeFromQuery } from "./theme";

// Zapier hooks
const ZAP1_URL = "https://hooks.zapier.com/hooks/catch/25247950/uf3fs1c/";
const ZAP2_URL = "https://hooks.zapier.com/hooks/catch/25247950/ufucr11/";

// Loan codes
type LoanCode =
  | "CRE" | "DSCR" | "BRIDGE" | "SBA" | "EQUIP"
  | "WC_LOC" | "FACTOR" | "FRANCHISE" | "SPECIALTY_AV" | "OTHER";

interface LoanTypeOption { code: LoanCode; label: string; }

type FieldKey =
  | "full_name" | "email" | "mobile_phone" | "business_legal_name"
  | "business_street" | "business_city" | "business_state" | "business_zip"
  | "entity_type" | "year_business_started" | "industry" | "business_description" | "owners_list"
  | "amount_requested" | "use_of_funds" | "ideal_timing" | "estimated_credit_word"
  | "revenue_last_year" | "revenue_ytd" | "profitability" | "existing_debt_summary"
  | "property_address" | "property_type" | "structure_size" | "year_built_condition"
  | "purchase_price" | "current_value" | "renovation_scope" | "capex_budget"
  | "occupancy_status" | "occupancy_pct" | "current_management"
  | "current_noi" | "t12_noi" | "gross_monthly_rent" | "vacancy_pct" | "projected_noi" | "stabilized_dscr"
  | "dscr_status" | "dscr_annual_taxes" | "dscr_annual_insurance" | "dscr_recurring_fees" | "dscr_rent_current" | "dscr_rent_expected"
  | "bridge_timeline" | "bridge_arv" | "bridge_exit_strategy"
  | "sba_purpose" | "sba_owners_20plus" | "sba_taxes_current" | "sba_pg_all" | "sba_collateral_available" | "sba_other_businesses"
  | "equip_type" | "equip_new_or_used" | "equip_purchase_price" | "equip_vendor" | "equip_useful_life" | "equip_use_case"
  | "wc_structure" | "wc_amount_basis" | "wc_ar_balance_dso" | "wc_existing_locs" | "wc_seasonality"
  | "fact_avg_monthly_invoiced" | "fact_customer_types" | "fact_payment_terms" | "fact_concentration" | "fact_past_due_or_disputed" | "fact_recent_slowing"
  | "fran_brand" | "fran_stage" | "fran_has_fdd" | "fran_location_status" | "fran_total_project_cost" | "fran_cash_injection" | "fran_other_funding" | "fran_experience"
  | "av_aircraft_type" | "av_txn_type" | "av_intended_use" | "av_base" | "av_annual_hours"
  | "other_notes";

type PropertyKey =
  | "property_address" | "property_type" | "structure_size" | "year_built_condition"
  | "purchase_price" | "current_value" | "renovation_scope" | "capex_budget"
  | "occupancy_status" | "occupancy_pct" | "current_management"
  | "current_noi" | "t12_noi" | "gross_monthly_rent" | "vacancy_pct" | "projected_noi" | "stabilized_dscr"
  | "dscr_annual_taxes" | "dscr_annual_insurance" | "dscr_recurring_fees"
  | "bridge_arv" | "bridge_timeline" | "bridge_exit_strategy";

type Property = { id: string } & Partial<Record<PropertyKey, string>>;

interface DocInput { name: string; label: string; multiple?: boolean; }

const LOAN_TYPES: LoanTypeOption[] = [
  { code: "CRE",          label: "Commercial Real Estate" },
  { code: "DSCR",         label: "DSCR / Long-Term Rental" },
  { code: "BRIDGE",       label: "Bridge / Fix & Flip" },
  { code: "SBA",          label: "SBA" },
  { code: "EQUIP",        label: "Equipment" },
  { code: "WC_LOC",       label: "Working Capital / Line of Credit" },
  { code: "FACTOR",       label: "Factoring (Invoice Financing)" },
  { code: "FRANCHISE",    label: "Franchise" },
  { code: "SPECIALTY_AV", label: "Aviation" },
  { code: "OTHER",        label: "Other / General" },
];

const universalFields: FieldKey[] = [
  "full_name","email","mobile_phone","business_legal_name","business_street","business_city","business_state","business_zip","entity_type",
  "year_business_started","industry","business_description","owners_list",
  "amount_requested","use_of_funds","ideal_timing","estimated_credit_word",
  "revenue_last_year","revenue_ytd","profitability","existing_debt_summary",
];

const fieldsByType: Record<LoanCode, FieldKey[]> = {
  CRE: ["property_address","property_type","structure_size","year_built_condition","purchase_price","current_value","renovation_scope","capex_budget",
        "occupancy_status","occupancy_pct","current_management","current_noi","t12_noi","gross_monthly_rent","vacancy_pct","projected_noi","stabilized_dscr"],
  DSCR:["property_address","property_type","structure_size","year_built_condition","occupancy_status","dscr_status","dscr_rent_current","dscr_rent_expected",
        "dscr_annual_taxes","dscr_annual_insurance","dscr_recurring_fees","stabilized_dscr"],
  BRIDGE:["property_address","property_type","year_built_condition","renovation_scope","capex_budget","bridge_arv","bridge_timeline","bridge_exit_strategy","projected_noi","stabilized_dscr"],
  SBA: ["property_address","property_type","structure_size","year_built_condition","renovation_scope","occupancy_status","revenue_last_year","revenue_ytd","profitability",
        "sba_purpose","sba_owners_20plus","sba_taxes_current","sba_pg_all","sba_collateral_available","sba_other_businesses"],
  EQUIP:["equip_type","equip_new_or_used","equip_purchase_price","equip_vendor","equip_useful_life","equip_use_case"],
  WC_LOC:["wc_structure","wc_amount_basis","wc_ar_balance_dso","wc_existing_locs","wc_seasonality","revenue_last_year","revenue_ytd"],
  FACTOR:["fact_avg_monthly_invoiced","fact_customer_types","fact_payment_terms","fact_concentration","fact_past_due_or_disputed","fact_recent_slowing"],
  FRANCHISE:["fran_brand","fran_stage","fran_has_fdd","fran_location_status","fran_total_project_cost","fran_cash_injection","fran_other_funding","fran_experience"],
  SPECIALTY_AV:["av_aircraft_type","av_txn_type","av_intended_use","av_base","av_annual_hours"],
  OTHER:["other_notes"],
};

const MULTI_SUPPORTED: LoanCode[] = ["CRE","DSCR","BRIDGE","OTHER"];

function propertyFieldList(code?: LoanCode): PropertyKey[] {
  const base: PropertyKey[] = [
    "property_address","property_type","structure_size","year_built_condition",
    "purchase_price","current_value","gross_monthly_rent",
    "occupancy_status","occupancy_pct","current_management",
    "renovation_scope","capex_budget","current_noi","t12_noi","projected_noi","stabilized_dscr",
  ];
  if (code === "DSCR") base.push("dscr_annual_taxes","dscr_annual_insurance","dscr_recurring_fees");
  if (code === "BRIDGE") base.push("bridge_arv","bridge_timeline","bridge_exit_strategy");
  return base;
}

const LABELS: Partial<Record<FieldKey | PropertyKey, string>> = {
  full_name:"Full Name", email:"Email", mobile_phone:"Mobile Phone",
  business_legal_name:"Business Legal Name", business_street:"Business Street Address",
  business_city:"Business City", business_state:"Business State", business_zip:"Business ZIP",
  entity_type:"Type of Entity (LLC, Corp, Partnership, Sole Prop)", year_business_started:"Year Business Started",
  industry:"Industry", business_description:"Briefly describe what your business does",
  owners_list:"List all owners & ownership percentages",
  amount_requested:"Requested Loan Amount (USD)", use_of_funds:"How will you use the funds?",
  ideal_timing:"Target close date or timeframe",
  estimated_credit_word:"How would you describe your personal credit? (Poor / Fair / Good / Excellent)",
  revenue_last_year:"Approximate gross revenue (last full year)", revenue_ytd:"Approximate gross revenue (year-to-date)",
  profitability:"Is the business profitable, breakeven, or at a loss?", existing_debt_summary:"Existing business debt (lenders, balances, monthly payments)",
  property_address:"Property Address", property_type:"Property Type (e.g., multifamily, retail, SFR, etc.)",
  structure_size:"Square Footage / Units / Beds", year_built_condition:"Year Built / Current Condition",
  purchase_price:"Purchase Price (if applicable, USD)", current_value:"Current Value (if known, USD)",
  renovation_scope:"Planned renovations / scope", capex_budget:"CapEx / Renovation Budget (USD)",
  occupancy_status:"Occupancy Status (occupied / vacant / lease-up / stabilized)", occupancy_pct:"Occupancy Percentage (%)",
  current_management:"Current management (self-managed or third-party)", current_noi:"Current NOI (annual, USD)",
  t12_noi:"Trailing-12 NOI (annual, USD)", gross_monthly_rent:"Gross Monthly Rent (USD)", vacancy_pct:"Vacancy Percentage (%)",
  projected_noi:"Projected NOI after plan (annual, USD)", stabilized_dscr:"Stabilized DSCR (if known)",
  dscr_status:"Is this a purchase or a refinance?", dscr_annual_taxes:"Annual property taxes (USD)", dscr_annual_insurance:"Annual insurance (USD)", dscr_recurring_fees:"HOA or other recurring property fees (USD)", dscr_rent_current:"Current total monthly rent (USD)", dscr_rent_expected:"Expected total monthly rent (USD)",
  bridge_arv:"Estimated After-Repair Value (ARV, USD)", bridge_timeline:"Expected timeline (rehab/hold to exit)", bridge_exit_strategy:"Exit strategy (sell, refi to long-term, etc.)",
  sba_purpose:"SBA purpose / use of proceeds (RE, acquisition, WC, equipment, etc.)", sba_owners_20plus:"Owners 20%+ (names & ownership percentages)",
  sba_taxes_current:"Are all business & personal taxes current? (Yes/No + details)", sba_pg_all:"Will all 20%+ owners personally guarantee? (Yes/No)",
  sba_collateral_available:"Business/personal collateral available (RE, equipment, investments, etc.)", sba_other_businesses:"Do any owners have other businesses? (Yes/No + brief list)",
  equip_type:"Equipment type (make/model/year, key specs)", equip_new_or_used:"Is the equipment new or used?",
  equip_purchase_price:"Equipment purchase price (incl. tax/shipping/install)", equip_vendor:"Vendor/dealer name (quote/invoice?)",
  equip_useful_life:"Expected useful life (years)", equip_use_case:"How will the equipment be used in the business?",
  wc_structure:"Are you seeking a one-time loan, a revolving LOC, or either?", wc_amount_basis:"Basis for amount (A/R, Inventory, Revenue)",
  wc_ar_balance_dso:"Typical A/R balance and average days outstanding (DSO)", wc_existing_locs:"Existing lines of credit (limits, usage, lenders)",
  wc_seasonality:"Seasonality (busy/slow periods)",
  fact_avg_monthly_invoiced:"Average monthly invoiced sales (USD)", fact_customer_types:"Typical customer types (enterprise, gov, SMB, etc.)",
  fact_payment_terms:"Standard payment terms (Net 30/45/60, etc.)", fact_concentration:"Any customer concentration over ~20–25%?",
  fact_past_due_or_disputed:"Past-due or disputed invoices? (brief details)", fact_recent_slowing:"Any recent slowing of payments/orders?",
  fran_brand:"Franchise brand", fran_stage:"Is this a new location, resale, or expansion?",
  fran_has_fdd:"Do you have an FDD (Franchise Disclosure Document)? (Yes/No)", fran_location_status:"Location/site status",
  fran_total_project_cost:"Total project cost", fran_cash_injection:"Personal cash injection (USD)",
  fran_other_funding:"Other funding sources", fran_experience:"Relevant operating/industry experience",
  av_aircraft_type:"Aircraft make/model/year (airframe/engine hours if known)", av_txn_type:"Transaction type (purchase/refi)",
  av_intended_use:"Intended use (personal/business/charter/mixed)", av_base:"Home base airport", av_annual_hours:"Expected annual flight hours",
  other_notes:"Notes about your request (anything else we should know)",
};

const ALL_DOCS: DocInput[] = [
  { name:"doc_pfs", label:"Personal Financial Statement" },
  { name:"doc_personal_tax_returns[]", label:"Personal Tax Returns (multi)", multiple:true },
  { name:"doc_entity_docs[]", label:"Entity Documents (multi)", multiple:true },
  { name:"doc_purchase_contract", label:"Purchase/Lease Contract or Agreement" },
  { name:"doc_rent_roll", label:"Rent Roll" },
  { name:"doc_t12", label:"T12 (Trailing-12 Financials)" },
  { name:"doc_business_tax_returns[]", label:"Business Tax Returns (multi)", multiple:true },
  { name:"doc_ytd_pl_bs", label:"YTD P&L + Balance Sheet" },
  { name:"doc_bank_statements[]", label:"Business Bank Statements (multi)", multiple:true },
  { name:"doc_resume_bio", label:"Owner Resume / Bio" },
  { name:"doc_insurance_quote", label:"Insurance Quote (if applicable)" },
  { name:"doc_construction_budget", label:"Construction/Build-Out Budget (if applicable)" },
  { name:"doc_draw_schedule", label:"Draw Schedule (if applicable)" },
  { name:"doc_environmental_report", label:"Environmental Report (if any)" },
  { name:"doc_survey", label:"Survey (if any)" },
];

const docsByType: Record<LoanCode,string[]> = {
  CRE:["doc_pfs","doc_entity_docs[]","doc_purchase_contract","doc_rent_roll","doc_t12","doc_business_tax_returns[]","doc_ytd_pl_bs","doc_bank_statements[]","doc_insurance_quote","doc_construction_budget","doc_draw_schedule","doc_environmental_report","doc_survey"],
  DSCR:["doc_pfs","doc_purchase_contract","doc_rent_roll","doc_t12","doc_bank_statements[]","doc_insurance_quote"],
  BRIDGE:["doc_pfs","doc_entity_docs[]","doc_purchase_contract","doc_construction_budget","doc_draw_schedule","doc_bank_statements[]","doc_business_tax_returns[]"],
  SBA:["doc_pfs","doc_personal_tax_returns[]","doc_business_tax_returns[]","doc_entity_docs[]","doc_ytd_pl_bs","doc_bank_statements[]","doc_resume_bio"],
  EQUIP:["doc_pfs","doc_business_tax_returns[]","doc_ytd_pl_bs","doc_bank_statements[]","doc_purchase_contract"],
  WC_LOC:["doc_business_tax_returns[]","doc_ytd_pl_bs","doc_bank_statements[]"],
  FACTOR:["doc_business_tax_returns[]","doc_bank_statements[]"],
  FRANCHISE:["doc_pfs","doc_personal_tax_returns[]","doc_business_tax_returns[]","doc_entity_docs[]","doc_bank_statements[]","doc_resume_bio","doc_purchase_contract"],
  SPECIALTY_AV:["doc_pfs","doc_personal_tax_returns[]","doc_entity_docs[]","doc_business_tax_returns[]","doc_insurance_quote","doc_bank_statements[]"],
  OTHER:["doc_pfs","doc_business_tax_returns[]","doc_ytd_pl_bs","doc_bank_statements[]","doc_entity_docs[]"],
};

function uuid(): string {
  if ((window.crypto as any)?.randomUUID) return (window.crypto as any).randomUUID();
  const s = () => Math.random().toString(16).slice(2);
  return Date.now() + "-" + s() + s();
}

const PrettyField: React.FC<{ name: FieldKey }> = ({ name }) => {
  const label = LABELS[name] ?? name;
  const isTextArea = ["business_description","other_notes","renovation_scope"].includes(name);
  return (
    <div className="span-6">
      <label>{label}</label>
      {isTextArea ? <textarea name={name} /> : <input name={name} />}
    </div>
  );
};

const PropertyField: React.FC<{
  loanCode?: LoanCode; propIndex: number; field: PropertyKey;
  value: string; onChange: (idx:number, key:PropertyKey, val:string)=>void;
}> = ({ loanCode, propIndex, field, value, onChange }) => {
  const label = LABELS[field] ?? field;
  const isTextArea = field === "renovation_scope";
  if ((field==="dscr_annual_taxes" || field==="dscr_annual_insurance" || field==="dscr_recurring_fees") && loanCode!=="DSCR") return null;
  if ((field==="bridge_arv" || field==="bridge_timeline" || field==="bridge_exit_strategy") && loanCode!=="BRIDGE") return null;
  return (
    <div className="span-6">
      <label>{label}</label>
      {isTextArea
        ? <textarea value={value||""} onChange={e=>onChange(propIndex, field, e.target.value)} />
        : <input value={value||""} onChange={e=>onChange(propIndex, field, e.target.value)} />}
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => { setThemeFromQuery(); }, []);

  const [loan, setLoan] = useState<LoanTypeOption|null>(null);
  const [status, setStatus] = useState("");
  const [hasMulti, setHasMulti] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leadId, setLeadId] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const formZap1Ref = useRef<HTMLFormElement>(null);
  const formZap2Ref = useRef<HTMLFormElement>(null);
  const zap2SubmittedRef = useRef(false);
  const zap2FallbackRef = useRef<number|null>(null);

  const visibleFields = useMemo<FieldKey[]>(() => {
    const code = loan?.code as LoanCode | undefined;
    const specific = code ? fieldsByType[code] : [];
    return hasMulti ? [...universalFields] : [...universalFields, ...specific];
  }, [loan?.code, hasMulti]);

  // Use this so it's not an unused local
  const visibleDocs = useMemo<DocInput[]>(() => {
    const code = loan?.code as LoanCode | undefined;
    if (!code) return [];
    const allowed = new Set(docsByType[code] || []);
    return ALL_DOCS.filter(d => allowed.has(d.name));
  }, [loan?.code]);

  function onLoanChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value as LoanCode | "";
    const found = LOAN_TYPES.find(l => l.code === code) || null;
    setLoan(found);
    setHasMulti(false);
    setProperties([]);
  }

  function addProperty(){ setProperties(prev => [...prev, { id: "prop_" + uuid() }]); }
  function removeProperty(idx:number){ setProperties(prev => prev.filter((_,i)=>i!==idx)); }
  function updateProperty(idx:number, key:PropertyKey, val:string){
    setProperties(prev => { const c=[...prev]; c[idx] = { ...c[idx], [key]: val }; return c; });
  }

  function ensureHidden(form: HTMLFormElement | null, name: string, value: string) {
    if (!form) return;
    let el = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!el) { el = document.createElement("input"); el.type="hidden"; el.name=name; form.appendChild(el); }
    el.value = value;
  }

  function submitZap2Once(){
    if (zap2SubmittedRef.current) return;
    zap2SubmittedRef.current = true;
    setStatus("Uploading documents to Zap 2…");
    formZap2Ref.current?.submit();
  }

  function onSubmit(e?: React.FormEvent){
    if (e) e.preventDefault();
    if (!loan) { setStatus("Please select a loan type before submitting."); return; }

    const multiActive = hasMulti && MULTI_SUPPORTED.includes(loan.code);
    const meta = { lead_id: "lead_" + uuid(), created_at: new Date().toISOString() };
    setLeadId(meta.lead_id); setCreatedAt(meta.created_at);

    const items = multiActive ? properties : [];
    const propertiesJson = JSON.stringify({ loan_type: loan.code, count: items.length, items });

    // Zap 1 fields
    ensureHidden(formZap1Ref.current, "lead_id", meta.lead_id);
    ensureHidden(formZap1Ref.current, "created_at", meta.created_at);
    ensureHidden(formZap1Ref.current, "loan_type", loan.code);
    ensureHidden(formZap1Ref.current, "loan_type_label", loan.label);
    ensureHidden(formZap1Ref.current, "status", "awaiting_owner_approval");
    ensureHidden(formZap1Ref.current, "owner_email", "jashton@ashtonaisolutions.com");
    ensureHidden(formZap1Ref.current, "has_multiple_properties", String(multiActive));
    ensureHidden(formZap1Ref.current, "properties_count", String(items.length));
    ensureHidden(formZap1Ref.current, "properties_json", propertiesJson);

    // Zap 2 fields
    ensureHidden(formZap2Ref.current, "lead_id", meta.lead_id);
    ensureHidden(formZap2Ref.current, "loan_type", loan.code);
    ensureHidden(formZap2Ref.current, "loan_type_label", loan.label);

    // Querystring backup
    if (formZap1Ref.current){
      const u = new URL(formZap1Ref.current.action);
      u.searchParams.set("lead_id", meta.lead_id);
      u.searchParams.set("created_at", meta.created_at);
      u.searchParams.set("loan_type", loan.code);
      u.searchParams.set("loan_type_label", loan.label);
      u.searchParams.set("has_multiple_properties", String(multiActive));
      u.searchParams.set("properties_count", String(items.length));
      formZap1Ref.current.action = u.toString();
    }
    if (formZap2Ref.current){
      const u2 = new URL(formZap2Ref.current.action);
      u2.searchParams.set("lead_id", meta.lead_id);
      u2.searchParams.set("loan_type", loan.code);
      u2.searchParams.set("loan_type_label", loan.label);
      formZap2Ref.current.action = u2.toString();
    }

    zap2SubmittedRef.current = false;
    if (zap2FallbackRef.current){ clearTimeout(zap2FallbackRef.current); zap2FallbackRef.current = null; }

    setStatus("Sending application details to Zap 1…");
    formZap1Ref.current?.submit();

    zap2FallbackRef.current = window.setTimeout(() => { submitZap2Once(); }, 1200);
  }

  useEffect(() => {
    const i1 = document.getElementById("zap1Target") as HTMLIFrameElement | null;
    const i2 = document.getElementById("zap2Target") as HTMLIFrameElement | null;
    if (!i1 || !i2) return;
    const onLoad1 = () => submitZap2Once();
    const onLoad2 = () => { setStatus("Done. Check Zap runs for results."); if (zap2FallbackRef.current){ clearTimeout(zap2FallbackRef.current); zap2FallbackRef.current = null; } };
    i1.addEventListener("load", onLoad1); i2.addEventListener("load", onLoad2);
    return () => { i1.removeEventListener("load", onLoad1); i2.removeEventListener("load", onLoad2); };
  }, []);

  const loan_type = loan?.code ?? "";
  const loan_type_label = loan?.label ?? "";
  const showMultiToggle = loan ? MULTI_SUPPORTED.includes(loan.code) : false;

  return (
    <div className="container">
      <iframe id="zap1Target" name="zap1Target" style={{display:"none"}} title="Zap 1" />
      <iframe id="zap2Target" name="zap2Target" style={{display:"none"}} title="Zap 2" />

      <div className="header">
        <img src="/logo.png" alt="Alpine logo" className="brand-img" />
        <div>
          <div className="h1">Alpine Commercial Funding</div>
          <div className="sub">Answer the questions below and upload any supporting documents.</div>
        </div>
      </div>

      <div className="card">
        <div className="grid">
          <div className="span-6">
            <label>Loan Type</label>
            <select value={loan?.code ?? ""} onChange={onLoanChange}>
              <option value="" disabled>Select a loan type…</option>
              {LOAN_TYPES.map(o => <option key={o.code} value={o.code}>{o.label} ({o.code})</option>)}
            </select>
            <div className="help" style={{marginTop:8}}>
              {loan ? <>Selected: <strong>{loan.label}</strong> — code: <strong>{loan.code}</strong></> : <>Please select a loan type to continue.</>}
            </div>
          </div>

          {showMultiToggle && (
            <div className="span-6">
              <label>Multiple properties?</label>
              <select
                value={hasMulti ? "yes" : "no"}
                onChange={(e) => {
                  const v = e.target.value === "yes";
                  setHasMulti(v);
                  if (v && properties.length === 0) setProperties([{id:"prop_"+uuid()},{id:"prop_"+uuid()}]);
                  if (!v) setProperties([]);
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <div className="help">Choose “Yes” to add multiple property sections.</div>
            </div>
          )}
        </div>
      </div>

      <form
        ref={formZap1Ref}
        className="card"
        method="post"
        action={ZAP1_URL}
        target="zap1Target"
        encType="application/x-www-form-urlencoded"
        onSubmit={(e)=>e.preventDefault()}
      >
        <div className="grid">
          <input type="hidden" name="loan_type" value={loan_type} />
          <input type="hidden" name="loan_type_label" value={loan_type_label} />
          <input type="hidden" name="lead_id" value={leadId} />
          <input type="hidden" name="created_at" value={createdAt} />
          <input type="hidden" name="status" value="awaiting_owner_approval" />
          <input type="hidden" name="owner_email" value="jashton@ashtonaisolutions.com" />
          <input type="hidden" name="has_multiple_properties" value={String(hasMulti)} />
          <input type="hidden" name="properties_count" value={String(properties.length)} />
          <input type="hidden" name="properties_json" value="" />
          {visibleFields.map((k) => <PrettyField key={k} name={k} />)}
        </div>
      </form>

      {loan && hasMulti && (
        <div className="card">
          <div className="grid">
            <div className="span-12">
              <div className="h2">Property Details ({properties.length})</div>
              <div className="help">Fill a block for each property. Add or remove as needed.</div>
            </div>
            {properties.map((p, idx) => (
              <div key={p.id} className="span-12" style={{borderTop:"1px solid var(--line)", paddingTop:12, marginTop:12}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                  <div className="h3">Property #{idx+1}</div>
                  <button className="btn" type="button" onClick={()=>removeProperty(idx)}>Remove</button>
                </div>
                <div className="grid">
                  {propertyFieldList(loan?.code).map((f) => (
                    <PropertyField key={f} loanCode={loan?.code} propIndex={idx} field={f} value={p[f] || ""} onChange={updateProperty} />
                  ))}
                </div>
              </div>
            ))}
            <div className="span-12" style={{display:"flex", gap:12}}>
              <button className="btn" type="button" onClick={addProperty}>Add Another Property</button>
            </div>
          </div>
        </div>
      )}

      {loan && (
        <form
          ref={formZap2Ref}
          className="card"
          method="post"
          action={ZAP2_URL}
          target="zap2Target"
          encType="multipart/form-data"
        >
          <div className="grid">
            <input type="hidden" name="lead_id" value={leadId} />
            <input type="hidden" name="loan_type" value={loan_type} />
            <input type="hidden" name="loan_type_label" value={loan_type_label} />

            {visibleDocs.map((meta) => (
              <div key={meta.name} className="span-6">
                <label>{meta.label}</label>
                <input
                  type="file"
                  name={meta.name}
                  {...(meta.multiple ? { multiple: true } : {})}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                />
              </div>
            ))}
          </div>
        </form>
      )}

      <div className="card">
        <div className="btnbar" style={{gap:12, flexWrap:"wrap"}}>
          <button className="btn primary" onClick={()=>onSubmit()}>Submit Details & Upload Documents</button>
          <span className="status">{status}</span>
        </div>
        {leadId && <div className="help" style={{marginTop:6}}>Lead ID for this submission: <strong>{leadId}</strong></div>}
        <div className="help" style={{marginTop:6}}>
          {loan ? (hasMulti ? "Tip: Fill each property block above, attach files, then submit." : "Tip: Attach any available files above before submitting.") :
            "Choose a loan type to see relevant questions and document uploads."}
        </div>
      </div>
    </div>
  );
};

export default App;
