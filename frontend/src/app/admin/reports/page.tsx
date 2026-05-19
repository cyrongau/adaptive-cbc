'use client';

import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

const REPORTS = [
  { id: '1', title: 'Monthly Enrollment Report', type: 'Enrollment', date: '2024-03-15', format: 'PDF' },
  { id: '2', title: 'Student Performance Summary', type: 'Performance', date: '2024-03-14', format: 'Excel' },
  { id: '3', title: 'Teacher Activity Log', type: 'Activity', date: '2024-03-13', format: 'CSV' },
  { id: '4', title: 'Platform Usage Statistics', type: 'Usage', date: '2024-03-12', format: 'PDF' },
];

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#dae2fd]">Reports</h2>
          <p className="text-sm text-[#becabd] mt-1">Generate and download platform reports.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <select className="px-4 py-2 bg-[#060e20] border border-[#3f4940] rounded-lg text-sm text-[#dae2fd] focus:border-[#7eda95] outline-none">
          <option value="all">All Types</option>
          <option value="enrollment">Enrollment</option>
          <option value="performance">Performance</option>
          <option value="activity">Activity</option>
        </select>
        <select className="px-4 py-2 bg-[#060e20] border border-[#3f4940] rounded-lg text-sm text-[#dae2fd] focus:border-[#7eda95] outline-none">
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="this-term">This Term</option>
        </select>
      </div>

      <div className="bg-[#171f33] border border-[#3f4940] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#131b2e] border-b border-[#3f4940]">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Report</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Format</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-[#becabd] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3f4940]">
            {REPORTS.map((report) => (
              <tr key={report.id} className="hover:bg-[#222a3d] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#7eda95]" />
                    <span className="text-sm font-semibold text-[#dae2fd]">{report.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#becabd]">{report.type}</td>
                <td className="px-6 py-4 text-sm text-[#becabd]">{report.date}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-[#89ceff]/10 text-[#89ceff] text-xs font-semibold rounded">{report.format}</span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-xs text-[#7eda95] font-semibold hover:underline uppercase tracking-wider flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}