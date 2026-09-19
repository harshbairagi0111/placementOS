import React from 'react';

export const MetricsBar: React.FC = () => {
  const stats = [
    { label: 'Engineering candidates verified', value: '54,000+' },
    { label: 'Campus placement drives supported', value: '320+' },
    { label: 'AI mock interviews completed', value: '180,000+' },
    { label: 'Average technical offer package', value: '₹14.2 LPA' },
  ];

  return (
    <section className="w-full bg-white border-b border-[#14131F]/8 py-8 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#14131F]/8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col text-left ${i > 0 ? 'lg:pl-8' : ''} ${i >= 2 ? 'pt-4 lg:pt-0' : ''}`}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#14131F] tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-[#14131F]/65 mt-1 font-normal">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
