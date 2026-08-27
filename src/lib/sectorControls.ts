import { Ledger, Voucher } from '../types';

export interface SectorControl { id:string; title:string; description:string; severity:'info'|'warning'; check:(ctx:{vouchers:Voucher[];ledgers:Ledger[]})=>boolean; }

const amount = (v:Voucher) => Math.abs(Number(v.totalAmount)||0);

export function getSectorControls(sector:string): SectorControl[] {
  const s = (sector||'General').toLowerCase();
  const common:SectorControl[] = [
    {id:'negative-ocf',title:'Operating cash flow review',description:'Operating cash flow is negative for the selected period; management should review operating liquidity and working-capital drivers.',severity:'warning',check:({vouchers,ledgers})=>false},
    {id:'classification-review',title:'Unclassified ledger review',description:'One or more ledgers lack an explicit financial-statement classification and should be reviewed before relying on automated FP&A outputs.',severity:'warning',check:({ledgers})=>ledgers.some(l=>!l.accountingClassification)}
  ];
  if(s==='manufacturing') return [...common,
    {id:'inventory',title:'Inventory / COGS control',description:'Review inventory and COGS classification, inventory movements and gross-margin consistency.',severity:'info',check:({ledgers})=>ledgers.some(l=>/inventory|stock/i.test(`${l.name} ${l.group}`))},
    {id:'capex',title:'Capex and fixed-asset control',description:'Review fixed-asset additions, disposals and depreciation separately from operating expenditure.',severity:'info',check:({ledgers})=>ledgers.some(l=>l.accountingClassification==='Fixed Asset')}
  ];
  if(s==='technology') return [...common,
    {id:'people-cost',title:'People-cost review',description:'Review payroll and employee-related operating costs as a key driver of operating leverage.',severity:'info',check:({ledgers})=>ledgers.some(l=>/salary|payroll|employee/i.test(`${l.name} ${l.group}`))},
    {id:'recurring-revenue',title:'Revenue quality review',description:'Where recurring revenue exists, reconcile recurring/customer receipts separately from one-off income.',severity:'info',check:({vouchers})=>vouchers.some(v=>v.type==='Sales')}
  ];
  if(s==='retail' || s==='fmcg') return [...common,
    {id:'inventory-turn',title:'Inventory turnover review',description:'Review stock balances, COGS and inventory turnover; investigate unusual stock build-up.',severity:'info',check:({ledgers})=>ledgers.some(l=>/inventory|stock/i.test(`${l.name} ${l.group}`))},
    {id:'margin',title:'Gross-margin review',description:'Review sales, COGS and gross-margin movements by period or product category where available.',severity:'info',check:({vouchers})=>vouchers.some(v=>v.type==='Sales')}
  ];
  if(s==='service based') return [...common,
    {id:'receivables',title:'Receivables and collections review',description:'Review customer receipts, trade receivables and collection timing as primary working-capital drivers.',severity:'info',check:({ledgers})=>ledgers.some(l=>l.accountingClassification==='Trade Receivable')},
    {id:'staffing',title:'Employee-cost review',description:'Review employee and contractor costs relative to revenue and operating cash flow.',severity:'info',check:({ledgers})=>ledgers.some(l=>/salary|payroll|employee|contractor/i.test(`${l.name} ${l.group}`))}
  ];
  if(s==='real estate' || s==='construction') return [...common,
    {id:'project-inventory',title:'Project inventory / WIP review',description:'Review project inventory, work-in-progress and customer advances separately from ordinary operating balances.',severity:'info',check:({ledgers})=>ledgers.some(l=>/inventory|wip|work.?in.?progress|project/i.test(`${l.name} ${l.group}`))},
    {id:'debt',title:'Project debt and liquidity review',description:'Review project loans, finance costs, repayment obligations and financing cash flows.',severity:'info',check:({ledgers})=>ledgers.some(l=>l.accountingClassification==='Loan / Debt')}
  ];
  if(s==='financial services') return [...common,
    {id:'debt-funding',title:'Funding and finance-cost review',description:'Review borrowing, funding mix and finance costs separately from operating income.',severity:'info',check:({ledgers})=>ledgers.some(l=>l.accountingClassification==='Loan / Debt' || l.accountingClassification==='Finance Cost')}
  ];
  if(s==='hospitality') return [...common,
    {id:'occupancy',title:'Revenue and operating-cost review',description:'Review revenue streams and major operating costs separately; sector-specific occupancy data should be added when available.',severity:'info',check:({vouchers})=>vouchers.some(v=>v.type==='Sales')}
  ];
  if(s==='logistics') return [...common,
    {id:'fleet-capex',title:'Fleet / fixed-asset review',description:'Review fleet and equipment capex, depreciation and financing separately from operating costs.',severity:'info',check:({ledgers})=>ledgers.some(l=>l.accountingClassification==='Fixed Asset')}
  ];
  return common;
}

export function runSectorControls(sector:string, vouchers:Voucher[], ledgers:Ledger[], operatingCashFlow:number) {
  return getSectorControls(sector).map(c => ({...c, triggered: c.id==='negative-ocf' ? operatingCashFlow < 0 : c.check({vouchers,ledgers})}));
}
