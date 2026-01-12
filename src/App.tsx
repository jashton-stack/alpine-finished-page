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
  | "other_notes"
  | "heard_about" | "heard_about_other";

type PropertyKey =
  | "property_address" | "property_type" | "structure_size" | "year_built_condition"
  | "purchase_price" | "current_value" | "renovation_scope" | "capex_budget"
  | "occupancy_status" | "occupancy_pct" | "current_management"
  | "current_noi" | "t12_noi" | "gross_monthly_rent" | "vacancy_pct" | "projected_noi" | "stabilized_dscr"
  | "dscr_annual_taxes" | "dscr_annual_insurance" | "dscr_recurring_fees"
  | "bridge_arv" | "bridge_timeline" | "bridge_exit_strategy";

type Property = { id: string } & Partial<Record<PropertyKey, string>>;

interface DocInput { name: string; label: string; multiple?: boolean; }

// ---------- File type policy (broad + safe) ----------
const ALLOWED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".rtf",
  ".zip",
  ".tif", ".tiff", ".jpg", ".jpeg", ".png", ".heic"
];

const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/rtf",
  "application/zip",
  "image/tiff", "image/jpeg", "image/png", "image/heic"
]);

const ACCEPT_STRING = [
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.zip,.tif,.tiff,.jpg,.jpeg,.png,.heic",
  "image/*"
].join(",");

// ---------- App constants ----------
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
  // always included for every loan type:
  "heard_about","heard_about_other",
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
  heard_about:"How did you hear about us?",
  heard_about_other:"If Other, please specify",
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

// ---- Helpers: properties text block + UTF-8 safe base64 ----
function buildPropertiesTextBlock(loanCode: LoanCode | "", props: Property[]): string {
  if (!props.length) return "";
  const lines: string[] = [];
  lines.push("Collateral / Property Information:");
  props.forEach((p, i) => {
    const n = i + 1;
    const sec: string[] = [];
    sec.push(`• Property #${n}`);
    if (p.property_address)       sec.push(`   - Property Address: ${p.property_address}`);
    if (p.property_type)          sec.push(`   - Property Type: ${p.property_type}`);
    if (p.structure_size)         sec.push(`   - Square Footage / Units / Beds: ${p.structure_size}`);
    if (p.year_built_condition)   sec.push(`   - Year Built / Condition: ${p.year_built_condition}`);
    if (p.purchase_price)         sec.push(`   - Purchase Price (USD): ${p.purchase_price}`);
    if (p.current_value)          sec.push(`   - Current Value (USD): ${p.current_value}`);
    if (p.renovation_scope)       sec.push(`   - Renovation Scope: ${p.renovation_scope}`);
    if (p.capex_budget)           sec.push(`   - CapEx Budget (USD): ${p.capex_budget}`);
    if (p.occupancy_status)       sec.push(`   - Occupancy Status: ${p.occupancy_status}`);
    if (p.occupancy_pct)          sec.push(`   - Occupancy Percentage (%): ${p.occupancy_pct}`);
    if (p.current_management)     sec.push(`   - Current Management: ${p.current_management}`);
    if (p.current_noi)            sec.push(`   - Current NOI (annual, USD): ${p.current_noi}`);
    if (p.t12_noi)                sec.push(`   - T12 NOI (annual, USD): ${p.t12_noi}`);
    if (p.gross_monthly_rent)     sec.push(`   - Gross Monthly Rent (USD): ${p.gross_monthly_rent}`);
    if (p.vacancy_pct)            sec.push(`   - Vacancy Percentage (%): ${p.vacancy_pct}`);
    if (p.projected_noi)          sec.push(`   - Projected NOI (annual, USD): ${p.projected_noi}`);
    if (p.stabilized_dscr)        sec.push(`   - Stabilized DSCR (if known): ${p.stabilized_dscr}`);
    if (loanCode === "DSCR") {
      if (p.dscr_annual_taxes)     sec.push(`   - Annual Property Taxes (USD): ${p.dscr_annual_taxes}`);
      if (p.dscr_annual_insurance) sec.push(`   - Annual Insurance (USD): ${p.dscr_annual_insurance}`);
      if (p.dscr_recurring_fees)   sec.push(`   - Recurring Fees (USD): ${p.dscr_recurring_fees}`);
    }
    if (loanCode === "BRIDGE") {
      if (p.bridge_arv)            sec.push(`   - Estimated ARV (USD): ${p.bridge_arv}`);
      if (p.bridge_timeline)       sec.push(`   - Timeline: ${p.bridge_timeline}`);
      if (p.bridge_exit_strategy)  sec.push(`   - Exit Strategy: ${p.bridge_exit_strategy}`);
    }
    lines.push(sec.join("\n"));
  });
  lines.push(""); // trailing newline
  return lines.join("\n");
}

function toBase64Utf8(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

// Remove duplicates and set a hidden field
function setOrReplaceHidden(form: HTMLFormElement | null, name: string, value: string) {
  if (!form) return;
  form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach(el => el.remove());
  const el = document.createElement("input");
  el.type = "hidden";
  el.name = name;
  el.value = value;
  form.appendChild(el);
}

// File validation: allow broad types; ≤ 9.5 MB per file; ≤ 30 MB total.
// Accept scanners (octet-stream) by trusting extension.
function hasAllowedExtension(name: string): boolean {
  const lower = (name || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext));
}
function isAllowedFile(file: File): boolean {
  if (ALLOWED_MIME_EXACT.has(file.type)) return true;
  if (/^image\//i.test(file.type)) return true;
  if (file.type === "application/octet-stream" && hasAllowedExtension(file.name)) return true;
  return hasAllowedExtension(file.name);
}
function validateZap2Files(form: HTMLFormElement | null): { ok: boolean; message?: string } {
  if (!form) return { ok: true };
  const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'));
  const maxBytesPerFile = 9.5 * 1024 * 1024; // ~10MB practical webhook limit
  const maxBytesTotal = 30 * 1024 * 1024;    // ~30MB total request guidance
  let total = 0;
  for (const inp of inputs) {
    const files = inp.files;
    if (!files || files.length === 0) continue; // optional
    for (const f of Array.from(files)) {
      if (!isAllowedFile(f)) {
        return { ok: false, message: `Unsupported file type: ${f.name}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")} and common images.` };
      }
      if (f.size > maxBytesPerFile) {
        return { ok: false, message: `File too large: ${f.name}. Please keep each file ≤ 9.5 MB.` };
      }
      total += f.size;
      if (total > maxBytesTotal) {
        return { ok: false, message: `Total upload size too large. Please keep all files combined ≤ 30 MB.` };
      }
    }
  }
  return { ok: true };
}

// Debug echo for Zap 2 trigger
function captureFilesManifest(form: HTMLFormElement | null): string {
  if (!form) return "";
  const rows: string[] = [];
  const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'));
  for (const inp of inputs) {
    const key = inp.name;
    const files = inp.files ? Array.from(inp.files).map(f => f.name) : [];
    if (files.length) rows.push(`${key}: ${files.join(", ")}`);
  }
  return rows.join(" | ");
}

const PrettyField: React.FC<{ name: FieldKey }> = ({ name }) => {
  const label = LABELS[name] ?? name;

  if (name === "heard_about") {
    return (
      <div className="span-6">
        <label>{label}</label>
        <select name="heard_about" defaultValue="">
          <option value="" disabled>Select…</option>
          <option value="Andrew">Andrew</option>
          <option value="Marty">Marty</option>
          <option value="Facebook">Facebook</option>
          <option value="Other">Other</option>
        </select>
      </div>
    );
  }
  if (name === "heard_about_other") {
    return (
      <div className="span-6">
        <label>{label}</label>
        <input name="heard_about_other" placeholder="If you chose 'Other', add detail" />
      </div>
    );
  }

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submittedRef = useRef(false); // hard one-shot guard

  const formZap1Ref = useRef<HTMLFormElement>(null);
  const formZap2Ref = useRef<HTMLFormElement>(null);
  const zap2SubmittedRef = useRef(false);
  const zap2FallbackRef = useRef<number|null>(null);

  const visibleFields = useMemo<FieldKey[]>(() => {
    const code = loan?.code as LoanCode | undefined;
    const specific = code ? fieldsByType[code] : [];
    // heard_about + heard_about_other live in universalFields => always shown
    return hasMulti ? [...universalFields] : [...universalFields, ...specific];
  }, [loan?.code, hasMulti]);

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

  function submitZap2Once(){
    if (zap2SubmittedRef.current) return;
    zap2SubmittedRef.current = true;
    // Inject debug files manifest before submit
    const manifest = captureFilesManifest(formZap2Ref.current);
    setOrReplaceHidden(formZap2Ref.current, "files_manifest", manifest);
    formZap2Ref.current?.submit();
  }

  function onSubmit(e?: React.FormEvent){
    if (e) e.preventDefault();
    if (!loan) { setStatus("Please select a loan type before submitting."); return; }

    // Validate files before any submit
    const fileCheck = validateZap2Files(formZap2Ref.current);
    if (!fileCheck.ok) {
      setStatus(fileCheck.message || "One or more files are invalid.");
      return;
    }

    // hard guard: ignore any subsequent attempts
    if (submittedRef.current || isSubmitting) return;
    submittedRef.current = true;
    setIsSubmitting(true);

    const multiActive = hasMulti && MULTI_SUPPORTED.includes(loan.code);
    const meta = { lead_id: "lead_" + uuid(), created_at: new Date().toISOString() };
    setLeadId(meta.lead_id); setCreatedAt(meta.created_at);

    // Build SINGLE TEXT BLOCK for properties_json, then base64 it
    const propsText = multiActive ? buildPropertiesTextBlock(loan.code, properties) : "";
    const propsTextB64 = toBase64Utf8(propsText);

    // Zap 1 fields (set/replace to avoid duplicates)
    setOrReplaceHidden(formZap1Ref.current, "lead_id", meta.lead_id);
    setOrReplaceHidden(formZap1Ref.current, "created_at", meta.created_at);
    setOrReplaceHidden(formZap1Ref.current, "loan_type", loan.code);
    setOrReplaceHidden(formZap1Ref.current, "loan_type_label", loan.label);
    setOrReplaceHidden(formZap1Ref.current, "status", "awaiting_owner_approval");
    setOrReplaceHidden(formZap1Ref.current, "owner_email", "jashton@ashtonaisolutions.com");

    // Lead source (from UI)
    const heardAboutSel = formZap1Ref.current?.querySelector<HTMLSelectElement>('select[name="heard_about"]');
    const heardAboutOtherInput = formZap1Ref.current?.querySelector<HTMLInputElement>('input[name="heard_about_other"]');
    setOrReplaceHidden(formZap1Ref.current, "heard_about", heardAboutSel?.value || "");
    setOrReplaceHidden(formZap1Ref.current, "heard_about_other", heardAboutOtherInput?.value || "");

    // Multi flags + SINGLE base64 TEXT in properties_json
    setOrReplaceHidden(formZap1Ref.current, "has_multiple_properties", String(multiActive));
    setOrReplaceHidden(formZap1Ref.current, "properties_count", String(multiActive ? properties.length : 0));
    setOrReplaceHidden(formZap1Ref.current, "properties_json", propsTextB64);

    // Zap 2 fields
    setOrReplaceHidden(formZap2Ref.current, "lead_id", meta.lead_id);
    setOrReplaceHidden(formZap2Ref.current, "loan_type", loan.code);
    setOrReplaceHidden(formZap2Ref.current, "loan_type_label", loan.label);

    // Querystring backup
    if (formZap1Ref.current){
      const u = new URL(formZap1Ref.current.action);
      u.searchParams.set("lead_id", meta.lead_id);
      u.searchParams.set("created_at", meta.created_at);
      u.searchParams.set("loan_type", loan.code);
      u.searchParams.set("loan_type_label", loan.label);
      u.searchParams.set("status", "awaiting_owner_approval");
      u.searchParams.set("owner_email", "jashton@ashtonaisolutions.com");
      u.searchParams.set("has_multiple_properties", String(multiActive));
      u.searchParams.set("properties_count", String(multiActive ? properties.length : 0));
      u.searchParams.set("properties_json", propsTextB64);
      u.searchParams.set("heard_about", heardAboutSel?.value || "");
      u.searchParams.set("heard_about_other", heardAboutOtherInput?.value || "");
      formZap1Ref.current.action = u.toString();
    }
    if (formZap2Ref.current){
      const u2 = new URL(formZap2Ref.current.action);
      u2.searchParams.set("lead_id", meta.lead_id);
      u2.searchParams.set("loan_type", loan.code);
      u2.searchParams.set("loan_type_label", loan.label);
      formZap2Ref.current.action = u2.toString();
    }

    setStatus("Submitting… please wait.");
    zap2SubmittedRef.current = false;
    if (zap2FallbackRef.current){ clearTimeout(zap2FallbackRef.current); zap2FallbackRef.current = null; }

    // Submit Zap 1 (text)
    formZap1Ref.current?.submit();

    // Submit Zap 2 (files) either on iframe load or fallback
    zap2FallbackRef.current = window.setTimeout(() => { submitZap2Once(); }, 1200);
  }

  useEffect(() => {
    const i1 = document.getElementById("zap1Target") as HTMLIFrameElement | null;
    const i2 = document.getElementById("zap2Target") as HTMLIFrameElement | null;
    if (!i1 || !i2) return;

    const onLoad1 = () => submitZap2Once();
    const onLoad2 = () => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setStatus("Your form has been submitted for review, we will send an update shortly.");
      if (zap2FallbackRef.current){ clearTimeout(zap2FallbackRef.current); zap2FallbackRef.current = null; }
    };

    i1.addEventListener("load", onLoad1);
    i2.addEventListener("load", onLoad2);
    return () => {
      i1.removeEventListener("load", onLoad1);
      i2.removeEventListener("load", onLoad2);
    };
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
            <select value={loan?.code ?? ""} onChange={onLoanChange} disabled={isSubmitted || isSubmitting}>
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
                disabled={isSubmitted || isSubmitting}
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
        style={isSubmitted ? { opacity: 0.7, pointerEvents: "none" } : {}}
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
          {/* properties_json injected dynamically */}

          {visibleFields.map((k) => <PrettyField key={k} name={k} />)}
        </div>
      </form>

      {loan && hasMulti && (
        <div className="card" style={isSubmitted ? { opacity: 0.7, pointerEvents: "none" } : {}}>
          <div className="grid">
            <div className="span-12">
              <div className="h2">Property Details ({properties.length})</div>
              <div className="help">Fill a block for each property. Add or remove as needed.</div>
            </div>
            {properties.map((p, idx) => (
              <div key={p.id} className="span-12" style={{borderTop:"1px solid var(--line)", paddingTop:12, marginTop:12}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                  <div className="h3">Property #{idx+1}</div>
                  <button className="btn" type="button" onClick={()=>removeProperty(idx)} disabled={isSubmitted || isSubmitting}>Remove</button>
                </div>
                <div className="grid">
                  {propertyFieldList(loan?.code).map((f) => (
                    <PropertyField key={f} loanCode={loan?.code} propIndex={idx} field={f} value={p[f] || ""} onChange={updateProperty} />
                  ))}
                </div>
              </div>
            ))}
            <div className="span-12" style={{display:"flex", gap:12}}>
              <button className="btn" type="button" onClick={addProperty} disabled={isSubmitted || isSubmitting}>Add Another Property</button>
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
          style={isSubmitted ? { opacity: 0.7, pointerEvents: "none" } : {}}
        >
          <div className="grid">
            <input type="hidden" name="lead_id" value={leadId} />
            <input type="hidden" name="loan_type" value={loan_type} />
            <input type="hidden" name="loan_type_label" value={loan_type_label} />

            <div className="span-12 help" style={{marginBottom:8}}>
              Supported: PDF, Word, Excel, CSV/TXT/RTF, ZIP, common images (JPEG/PNG/TIFF/HEIC). Per file ≤ 9.5 MB; total ≤ 30 MB.
            </div>

            {visibleDocs.map((meta) => (
              <div key={meta.name} className="span-6">
                <label>{meta.label}</label>
                <input
                  type="file"
                  name={meta.name}
                  {...(meta.multiple ? { multiple: true } : {})}
                  accept={ACCEPT_STRING}
                  disabled={isSubmitted || isSubmitting}
                />
              </div>
            ))}
          </div>
        </form>
      )}

      <div className="card">
        {!isSubmitted ? (
          <div className="btnbar" style={{gap:12, flexWrap:"wrap"}}>
            <button
              className="btn primary"
              onClick={()=>onSubmit()}
              disabled={isSubmitting}
              style={isSubmitting ? { opacity:.7, cursor:"not-allowed" } : {}}
            >
              {isSubmitting ? "Submitting…" : "Submit Details & Upload Documents"}
            </button>
            <span className="status">{status}</span>
          </div>
        ) : (
          <div className="h3" style={{color:"var(--ink)"}}>
            Your form has been submitted for review, we will send an update shortly.
          </div>
        )}
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
