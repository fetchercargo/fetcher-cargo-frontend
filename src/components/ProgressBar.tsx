import { STATUS_STEPS, type ShipmentStatus } from '@/lib/types';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ProgressBar({ status }: { status: ShipmentStatus }) {
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-8">
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i <= currentIndex
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-400'
                } ${i === currentIndex ? 'ring-2 sm:ring-4 ring-green-200' : ''}`}
              >
                {i <= currentIndex ? <CheckIcon /> : <span className="text-xs sm:text-sm font-medium">{i + 1}</span>}
              </div>
              <span
                className={`mt-2 text-[10px] sm:text-xs font-medium text-center max-w-[60px] sm:max-w-[80px] leading-tight ${
                  i <= currentIndex ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
            {/* Connecting line */}
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-0.5 sm:mx-1 rounded-full transition-all duration-300 ${
                  i < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
