import type { ShipmentTracking } from '@/lib/types';
import ProgressBar from './ProgressBar';
import Timeline from './Timeline';
import { FALLBACK_STATUSES, dotClasses, statusMap, type StatusConfig } from '@/lib/status';

export default function TrackingResult({ data, statuses }: { data: ShipmentTracking; statuses?: StatusConfig[] }) {
  const list = statuses && statuses.length ? statuses : FALLBACK_STATUSES;
  const map = statusMap(list);
  const current = map[data.status];

  return (
    <div className="w-full mt-8 animate-fade-in">
      {/* Status + Estimated Delivery */}
      <div className="text-center">
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white ${dotClasses(current?.color ?? 'purple')}`}>
          {current?.label ?? data.status}
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
      <ProgressBar status={data.status} statuses={list} />

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
