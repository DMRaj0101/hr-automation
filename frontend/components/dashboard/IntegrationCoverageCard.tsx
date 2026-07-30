import { IntegrationCoverage } from "@/types/onboarding";

export function IntegrationCoverageCard({ data }: { data: IntegrationCoverage }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-vantara-navy">
        Integration Coverage — Real vs Mock
      </h3>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-md">
        <div
          style={{ width: `${data.realPct}%`, backgroundColor: "#166534" }}
        />
        <div
          style={{ width: `${data.mockPct}%`, backgroundColor: "#991B1B" }}
        />
      </div>
      <div className="mt-3 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#166534" }} />
          <span className="text-vantara-navy">Real</span>
          <span className="text-vantara-text-muted">
            {data.realCount} ({data.realPct}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#991B1B" }} />
          <span className="text-vantara-navy">Mock</span>
          <span className="text-vantara-text-muted">
            {data.mockCount} ({data.mockPct}%)
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-vantara-text-faint">
        Real: {data.realSystems.join(", ")}. Mock: {data.mockSystems.join(", ")}.
      </p>
    </div>
  );
}
