/**
 * Display retrieval performance metrics.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Database } from "lucide-react";
import {
  getLatencyColor,
  getLatencyTextColor,
} from "@/lib/utils/colors";
import { formatLatency } from "@/lib/utils/formatting";

interface MetricsPanelProps {
  latencyMs: number;
  cacheHit: boolean;
}

export function MetricsPanel({ latencyMs, cacheHit }: MetricsPanelProps) {
  const isFast = latencyMs < 100;
  const isNormal = latencyMs < 3000;

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-lg">Metrics</h3>

      <div className="space-y-3">
        {/* Latency */}
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Latency</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${getLatencyTextColor(latencyMs)}`}
            >
              {formatLatency(latencyMs)}
            </span>
            <Badge
              className={`${getLatencyColor(latencyMs)} ${getLatencyTextColor(latencyMs)}`}
            >
              {isFast ? "🚀 Cached" : isNormal ? "⚡ Normal" : "⏱️ Slow"}
            </Badge>
          </div>
        </div>

        {/* Cache Status */}
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Cache</span>
          </div>
          <Badge
            className={
              cacheHit
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }
          >
            {cacheHit ? "✓ HIT" : "MISS"}
          </Badge>
        </div>

        {/* Performance notes */}
        <div className="pt-2 border-t border-gray-200">
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              <strong>p95 target:</strong> &lt;3000ms (p99: &lt;5000ms)
            </p>
            <p>
              <strong>Cache hit target:</strong> &lt;100ms
            </p>
            {cacheHit && (
              <p className="text-green-600">
                ✓ Retrieved from cache (previous query)
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
