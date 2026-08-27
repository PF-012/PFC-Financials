function getGeminiKey(): string {
  const raw = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const key = raw.trim().replace(/^['"]|['"]$/g, '');
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return key;
}

async function generateGeminiContent(model: string, prompt: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':getGeminiKey()}, body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.2}}) });
  const payload:any=await response.json().catch(()=>({}));
  if(!response.ok){const error:any=new Error(payload?.error?.message||`Gemini API returned HTTP ${response.status}.`);error.status=response.status;throw error;}
  return payload?.candidates?.[0]?.content?.parts?.map((part:any)=>part?.text||'').join('')||'';
}
function formatGeminiError(err:any):string{const message=err?.message||String(err);if(err?.status===401||err?.status===403)return 'Gemini rejected the configured API credential. Check that GEMINI_API_KEY contains a valid Gemini API key from Google AI Studio.';if(err?.status===429)return 'Gemini API rate limit or quota has been reached. Please try again later.';return message;}

const sectorGuidance:Record<string,string>={
  Manufacturing:'Focus on inventory/COGS, gross margin, working capital, capex, depreciation and fixed-asset intensity. Flag unusual inventory build-up or capex-heavy cash use.',
  Technology:'Focus on recurring/repeatable revenue where evidenced, payroll/people costs, operating leverage, receivables and asset-light cash conversion. Do not assume recurring revenue without data.',
  Retail:'Focus on inventory turnover, gross margin, stock build-up, supplier funding and cash conversion.',
  FMCG:'Focus on COGS, gross margin, inventory turnover, working capital and supplier/customer cash cycles.',
  'Service Based':'Focus on receivables, collections, employee/contractor costs, operating margin and cash conversion.',
  'Real Estate':'Focus on project inventory/WIP, customer advances, project debt, finance costs and capex.',
  Construction:'Focus on WIP/project balances, customer advances, retention/receivables, debt, finance costs and capex.',
  Hospitality:'Focus on operating margins, major operating cost drivers, liquidity and revenue quality; do not invent occupancy data.',
  Logistics:'Focus on fleet/fixed assets, depreciation, fuel/operating costs, capex and financing.',
  'Financial Services':'Focus on funding mix, finance costs, liquidity and asset/liability structure; do not invent regulatory ratios.',
  Healthcare:'Focus on receivables/collections, staffing costs, asset intensity, capex and operating cash conversion.',
  'Financial Services':'Focus on funding mix, finance costs, liquidity and asset/liability structure; do not invent regulatory ratios.'
};

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    const {metrics,sector}=req.body||{};
    const selectedSector=sector||'General';
    const guidance=sectorGuidance[selectedSector]||'Use the supplied accounting data to identify the most material business and cash-flow drivers without assuming sector facts not supported by the data.';
    const prompt=`You are an expert CFO and financial analyst acting as a human-in-the-loop AI for an accounting platform.\nCompany sector: ${selectedSector}.\nSector-specific analytical focus: ${guidance}\nReview ONLY the supplied actual accounting metrics and cash-flow classification. Do not invent or alter any actual number.\nThe cashFlow object is a direct cash/bank movement analysis. Treat Sales, Purchase and Journal vouchers as non-cash unless an actual Receipt/Payment exists.\nAnalyze operating cash flow, investing cash flow, financing cash flow, other cash flow, net cash flow, closing cash and runway.\nPay special attention to government grants/subsidies, loans, capital contributions, fixed-asset purchases/disposals and other funding so they are not incorrectly described as sales revenue.\nApply the sector focus only as an analytical lens; never fabricate sector metrics, benchmarks or transactions that are absent from the supplied data. Clearly identify data limitations.\nAlways use INR and ₹. Preserve supplied numbers and use no more than 2 decimal places.\nMetrics: ${JSON.stringify(metrics,null,2)}\nRespond in professional clean Markdown. Include: Executive Summary; Sector-Specific Control Observations; Cash Flow Analysis; Liquidity/Runway; Key Risks & Controls; Management Recommendations. Begin with a concise FY disclosure of Total Revenue, Closing Cash & Bank, Operating Cash Flow, Financing Cash Flow, Expenses and Net Profit strictly from the supplied metrics.`;
    const commentary=await generateGeminiContent('gemini-3.1-flash-lite',prompt);
    return res.status(200).json({commentary});
  }catch(err:any){console.error('CFO Insights error:',err);return res.status(500).json({error:'Failed to generate insights: '+formatGeminiError(err)});}
}
