import React from 'react';
import { BookOpen, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

export default function GoldenRules() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Golden Rules of Accounting</h1>
        <p className="text-gray-600">The fundamental principles that govern how financial transactions are recorded.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Account */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Personal Accounts</h2>
              <p className="text-sm text-gray-600">Accounts representing Individuals & Companies</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="font-bold text-green-600 w-12 shrink-0">Debit:</span>
                <span className="text-gray-800 font-medium">The Receiver</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-red-600 w-12 shrink-0">Credit:</span>
                <span className="text-gray-800 font-medium">The Giver</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Example</p>
              <p className="text-sm text-gray-700"><strong>Paid ₹10,000 to John.</strong></p>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li><span className="text-green-600 font-medium">Dr:</span> John A/c (He is the receiver)</li>
                <li><span className="text-red-600 font-medium">Cr:</span> Cash A/c</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Real Account */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-purple-50 border-b border-gray-200 p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-700">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Real Accounts</h2>
              <p className="text-sm text-gray-600">Accounts representing Assets & Properties</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="font-bold text-green-600 w-12 shrink-0">Debit:</span>
                <span className="text-gray-800 font-medium">What comes in</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-red-600 w-12 shrink-0">Credit:</span>
                <span className="text-gray-800 font-medium">What goes out</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Example</p>
              <p className="text-sm text-gray-700"><strong>Bought Furniture for ₹5,000 cash.</strong></p>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li><span className="text-green-600 font-medium">Dr:</span> Furniture A/c (It comes in)</li>
                <li><span className="text-red-600 font-medium">Cr:</span> Cash A/c (It goes out)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Nominal Account */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 border-b border-gray-200 p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-700">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Nominal Accounts</h2>
              <p className="text-sm text-gray-600">Accounts representing Incomes & Expenses</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="font-bold text-green-600 w-12 shrink-0">Debit:</span>
                <span className="text-gray-800 font-medium">All expenses & losses</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-red-600 w-12 shrink-0">Credit:</span>
                <span className="text-gray-800 font-medium">All incomes & gains</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Example</p>
              <p className="text-sm text-gray-700"><strong>Paid Salary of ₹20,000.</strong></p>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li><span className="text-green-600 font-medium">Dr:</span> Salary A/c (It is an expense)</li>
                <li><span className="text-red-600 font-medium">Cr:</span> Cash A/c (Real A/c - goes out)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-sm text-gray-700">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-gray-500" /> Wait, why does my bank debit/credit mean the opposite?
        </h3>
        <p>
          When you receive an SMS saying "Your account is <strong>Credited</strong>", it is from the <strong>Bank's perspective</strong>. 
          To the bank, your money is their liability (they owe it to you). An increase in liability is a Credit for them. 
          In <strong>your</strong> accounting books, however, your bank balance is an Asset (Real Account), so when money comes in, you <strong>Debit</strong> it.
        </p>
      </div>
    </div>
  );
}
