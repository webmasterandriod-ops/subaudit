import React from 'react';

export const LedgerSkeleton: React.FC = () => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading local subscription ledger"
      className="space-y-4 animate-pulse"
    >
      {/* Hero Skeleton Card */}
      <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] p-6 space-y-4">
        <div className="h-3.5 w-36 bg-[#1A1F2C] rounded" />
        <div className="h-10 w-56 bg-[#1A1F2C] rounded-lg" />
        <div className="flex items-center gap-4 pt-2">
          <div className="h-4 w-32 bg-[#1A1F2C] rounded" />
          <div className="h-4 w-24 bg-[#1A1F2C] rounded" />
        </div>
      </div>

      {/* List Row Skeletons */}
      <div className="bg-[#12151E] border border-[#1E2433] rounded-[20px] divide-y divide-[#1E2433]">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-44 bg-[#1A1F2C] rounded" />
              <div className="h-3 w-32 bg-[#1A1F2C] rounded" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 w-20 bg-[#1A1F2C] rounded ml-auto" />
              <div className="h-3 w-14 bg-[#1A1F2C] rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
