import React, { useState, useEffect } from 'react';
import { X, Loader2, FileSpreadsheet, TrendingUp, AlertCircle, Calculator } from 'lucide-react';
import { Company } from '../types';

interface FRFSAModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  metrics: any;
}

export default function FRFSAModal({ isOpen, onClose, activeCompany, metrics }: FRFSAModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'assumptions' | 'forecasting' | 'ratios' | 'dcf'>('assumptions');

  useEffect(() => {
    if (isOpen && !data && !loading) {
      generateFRFSA();
    }
  }, [isOpen]);

  const generateFRFSA = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate-frfsa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metrics, 
          sector: activeCompany.settings?.sector || 'General',
          companyName: activeCompany.name
        })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate financial model.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Financial Reporting, Forecasting & Strategic Analysis (FRFSA)</h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium ml-2">
              Sector: {activeCompany.settings?.sector || 'General'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full p-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-800">Generating Financial Model...</h3>
              <p className="text-gray-500 text-sm mt-2 max-w-md text-center">
                AI is constructing a comprehensive DCF valuation, projecting revenue forecasts, and performing ratio analysis tailored to the {activeCompany.settings?.sector || 'General'} sector.
              </p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full p-6 text-red-600 flex-col gap-3">
              <AlertCircle className="w-10 h-10" />
              <p>{error}</p>
              <button onClick={generateFRFSA} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Retry</button>
            </div>
          ) : data ? (
            <div className="flex flex-col h-full">
              {data.executiveSummary && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 m-4 mb-0 rounded-r shadow-sm">
                  <h3 className="text-blue-900 font-semibold mb-1 text-sm uppercase tracking-wider">Current FY Disclosure & Basis</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">{data.executiveSummary}</p>
                </div>
              )}
              <div className="flex border-b border-gray-300 bg-white px-4 mt-4">
                <button onClick={() => setActiveTab('assumptions')} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'assumptions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Assumptions</button>
                <button onClick={() => setActiveTab('forecasting')} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'forecasting' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Forecasting</button>
                <button onClick={() => setActiveTab('ratios')} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'ratios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Ratio Analysis</button>
                <button onClick={() => setActiveTab('dcf')} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'dcf' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>DCF Valuation</button>
              </div>
              
              <div className="flex-1 overflow-auto p-4 bg-white m-4 rounded shadow-sm border border-gray-300">
                {activeTab === 'assumptions' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Key Model Assumptions</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                          <tr>
                            <th className="px-4 py-2 border border-gray-300 font-bold text-gray-700">Parameter</th>
                            <th className="px-4 py-2 border border-gray-300 font-bold text-gray-700">Value</th>
                            <th className="px-4 py-2 border border-gray-300 font-bold text-gray-700">Rationale ({activeCompany.settings?.sector || 'General'} Sector)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.assumptions?.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border border-gray-300 font-medium">{item.parameter}</td>
                              <td className="px-4 py-2 border border-gray-300 text-blue-600 font-mono">{item.value}</td>
                              <td className="px-4 py-2 border border-gray-300 text-gray-600">{item.rationale}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {activeTab === 'forecasting' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">3-Year Financial Forecast</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                          <tr>
                            <th className="px-4 py-2 border border-gray-300 text-left font-bold text-gray-700">Line Item (in ₹)</th>
                            <th className="px-4 py-2 border border-gray-300 font-bold text-gray-700">Current Year (Y0)</th>
                            <th className="px-4 py-2 border border-gray-300 font-bold text-gray-700">Year 1</th>
                            <th className="px-4 py-2 border border-gray-300 font-bold text-gray-700">Year 2</th>
                            <th className="px-4 py-2 border border-gray-300 font-bold text-gray-700">Year 3</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.forecasting?.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border border-gray-300 text-left font-medium">{item.lineItem}</td>
                              <td className="px-4 py-2 border border-gray-300 font-mono">{item.y0}</td>
                              <td className="px-4 py-2 border border-gray-300 font-mono">{item.y1}</td>
                              <td className="px-4 py-2 border border-gray-300 font-mono">{item.y2}</td>
                              <td className="px-4 py-2 border border-gray-300 font-mono">{item.y3}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {activeTab === 'ratios' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Sector-Specific Ratio Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.ratios?.map((item: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm">
                          <h4 className="font-semibold text-gray-800 mb-2">{item.name}</h4>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-2xl font-bold font-mono text-blue-700">{item.value}</span>
                            <span className="text-sm text-gray-500 mb-1">Benchmark: {item.benchmark}</span>
                          </div>
                          <p className="text-xs text-gray-600 border-t pt-2 mt-2">{item.analysis}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'dcf' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Discounted Cash Flow (DCF) Valuation</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700">Valuation Metrics</div>
                        <div className="p-4 space-y-3 bg-white">
                          <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Cost of Capital (WACC)</span>
                            <span className="font-mono font-medium">{data.dcf?.wacc}</span>
                          </div>
                          <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-600">Terminal Growth Rate</span>
                            <span className="font-mono font-medium">{data.dcf?.terminalGrowth}</span>
                          </div>
                          <div className="flex justify-between pt-2">
                            <span className="font-semibold text-gray-800">Enterprise Value</span>
                            <span className="font-mono font-bold text-emerald-700">{data.dcf?.enterpriseValue}</span>
                          </div>
                          <div className="flex justify-between pt-2">
                            <span className="font-semibold text-gray-800">Implied Equity Value</span>
                            <span className="font-mono font-bold text-emerald-700">{data.dcf?.equityValue}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm flex flex-col justify-center">
                        <Calculator className="w-8 h-8 text-blue-500 mb-3 mx-auto" />
                        <h4 className="text-center font-medium text-gray-800 mb-2">Valuation Summary</h4>
                        <p className="text-sm text-gray-600 text-center">{data.dcf?.summary}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
