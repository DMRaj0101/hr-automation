import { TicketDetail } from "@/types/ticket";

export function ErrorDetailsCard({ detail }: { detail: TicketDetail }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-vantara-navy">Error Details</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-vantara-text-muted">Type</div>
          <div className="mt-0.5 font-semibold text-vantara-navy">{detail.errorType}</div>
        </div>
        <div>
          <div className="text-xs text-vantara-text-muted">Code</div>
          <div className="mt-0.5 font-mono font-semibold text-vantara-navy">{detail.errorCode}</div>
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <div className="text-xs text-vantara-text-muted">Message</div>
          <div className="mt-0.5 text-vantara-navy">{detail.errorMessage}</div>
        </div>
        <div>
          <div className="text-xs text-vantara-text-muted">Retry Count</div>
          <div className="mt-0.5 font-semibold text-vantara-navy">{detail.retryCount}</div>
        </div>
        <div>
          <div className="text-xs text-vantara-text-muted">Next Retry</div>
          <div className="mt-0.5 font-semibold text-vantara-navy">{detail.nextRetry}</div>
        </div>
      </div>
    </div>
  );
}
