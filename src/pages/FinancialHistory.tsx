import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { firestoreService } from '@/services/firestoreService';

export default function FinancialHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await firestoreService.getAll('goals');
      // Sort by month descending
      const sortedData = data.sort((a: any, b: any) => b.month.localeCompare(a.month));
      setHistory(sortedData);
    } catch (error) {
      console.error('Failed to fetch history');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">سجل النتائج المالية</h2>
      
      {history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((record) => (
            <div key={record.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <span className="font-bold text-lg text-gray-900">
                  {format(new Date(record.month), 'MMMM yyyy', { locale: ar })}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-mono">
                  {record.month}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-md text-green-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-600">الأرباح</span>
                  </div>
                  <span className="font-bold text-green-700">{record.actual_profit?.toLocaleString()} ₪</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-600">الإيرادات</span>
                  </div>
                  <span className="font-bold text-indigo-700">{record.actual_revenue?.toLocaleString()} ₪</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-md text-red-600">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-600">المصاريف</span>
                  </div>
                  <span className="font-bold text-red-700">{record.actual_expenses?.toLocaleString()} ₪</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد سجلات مالية محفوظة حتى الآن</p>
        </div>
      )}
    </div>
  );
}
