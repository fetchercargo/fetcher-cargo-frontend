import type { ShipmentTracking } from '@/lib/types';
import ProgressBar from './ProgressBar';
import Timeline from './Timeline';

export default function TrackingResult({ data }: { data: ShipmentTracking }) {
  return (
    <div className="w-full mt-8 animate-fade-in">
      {/* Status + Estimated Delivery */}
      <div className="text-center">
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white ${
          data.status === 'DELIVERED' ? 'bg-green-500' :
          data.status === 'CANCELLED' || data.status === 'RTO' ? 'bg-red-500' :
          data.status === 'ISSUE/DELAYED' ? 'bg-amber-500' :
          'bg-brand-purple'
        }`}>
          {data.status}
        </span>
        {data.estimatedDeliveryDate && (
          <p className="text-gray-500 text-sm mt-3">
            Estimated Delivery: <span className="font-medium text-gray-700">{data.estimatedDeliveryDate}</span>
          </p>
        )}
        {data.mode && (
          <p className="text-gray-400 text-xs mt-1">
            Mode: {data.mode}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar status={data.status} />

      {/* Timeline */}
      <Timeline updates={data.updates} awb={data.awb} />

      {/* Additional Info */}
      {data.additionalInfo && (
        <div className="max-w-2xl mx-auto mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Note:</span> {data.additionalInfo}
          </p>
        </div>
      )}
    </div>
  );
}
