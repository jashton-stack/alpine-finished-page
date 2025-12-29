export type LoanCode =
  | "CRE" | "DSCR" | "BRIDGE" | "SBA" | "EQUIP"
  | "WC_LOC" | "FACTOR" | "FRANCHISE" | "SPECIALTY_AV" | "OTHER";

export interface LoanTypeOption {
  code: LoanCode;
  label: string; // human-readable for loan_type_label
}

export type FieldKey =
  // universal
  | "full_name" | "email" | "mobile_phone" | "business_legal_name"
  | "business_street" | "business_city" | "business_state" | "business_zip"
  | "entity_type" | "year_business_started" | "industry" | "business_description" | "owners_list"
  | "amount_requested" | "use_of_funds" | "ideal_timing" | "estimated_credit_word"
  | "revenue_last_year" | "revenue_ytd" | "profitability" | "existing_debt_summary"
  // shared property & income
  | "property_address" | "property_type" | "structure_size" | "year_built_condition"
  | "purchase_price" | "current_value" | "renovation_scope" | "capex_budget"
  | "occupancy_status" | "occupancy_pct" | "current_management"
  | "current_noi" | "t12_noi" | "gross_monthly_rent" | "vacancy_pct" | "projected_noi" | "stabilized_dscr"
  // DSCR
  | "dscr_status" | "dscr_annual_taxes" | "dscr_annual_insurance" | "dscr_recurring_fees" | "dscr_rent_current" | "dscr_rent_expected"
  // Bridge
  | "bridge_timeline" | "bridge_arv" | "bridge_exit_strategy"
  // SBA
  | "sba_purpose" | "sba_owners_20plus" | "sba_taxes_current" | "sba_pg_all" | "sba_collateral_available" | "sba_other_businesses"
  // Equip
  | "equip_type" | "equip_new_or_used" | "equip_purchase_price" | "equip_vendor" | "equip_useful_life" | "equip_use_case"
  // WC/LOC
  | "wc_structure" | "wc_amount_basis" | "wc_ar_balance_dso" | "wc_existing_locs" | "wc_seasonality"
  // Factoring
  | "fact_avg_monthly_invoiced" | "fact_customer_types" | "fact_payment_terms" | "fact_concentration" | "fact_past_due_or_disputed" | "fact_recent_slowing"
  // Franchise
  | "fran_brand" | "fran_stage" | "fran_has_fdd" | "fran_location_status" | "fran_total_project_cost" | "fran_cash_injection" | "fran_other_funding" | "fran_experience"
  // Aviation
  | "av_aircraft_type" | "av_txn_type" | "av_intended_use" | "av_base" | "av_annual_hours"
  // Other
  | "other_notes";

export interface DocInput {
  name: string;
  label: string;
  multiple?: boolean;
}
