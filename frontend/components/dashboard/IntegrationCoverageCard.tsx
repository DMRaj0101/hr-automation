import { IntegrationCoverage } from "@/types/onboarding";

export function IntegrationCoverageCard({
  data,
}: {
  data: IntegrationCoverage;
}) {
  return (
    <div className="dashboard-card dashboard-coverage-card">
      <div className="dashboard-coverage-header">
        <h3 className="dashboard-card-title">
          Integration Coverage — Real vs Mock
        </h3>

        <div className="dashboard-coverage-percentages">
          <span className="dashboard-real-text">
            {data.realPct}% <span>Real</span>
          </span>

          <span className="dashboard-mock-text">
            {data.mockPct}% <span>Mock</span>
          </span>
        </div>
      </div>

      <div className="dashboard-coverage-bar">
        <div
          className="dashboard-coverage-real-bar"
          style={{ width: `${data.realPct}%` }}
        />

        <div
          className="dashboard-coverage-mock-bar"
          style={{ width: `${data.mockPct}%` }}
        />
      </div>

      <div className="dashboard-coverage-legend">
        <div className="dashboard-legend-item">
          <span className="dashboard-legend-dot dashboard-real-dot" />

          <span className="dashboard-legend-label">
            Real
          </span>

          <span className="dashboard-legend-count">
            {data.realCount} ({data.realPct}%)
          </span>
        </div>

        <div className="dashboard-legend-item">
          <span className="dashboard-legend-dot dashboard-mock-dot" />

          <span className="dashboard-legend-label">
            Mock
          </span>

          <span className="dashboard-legend-count">
            {data.mockCount} ({data.mockPct}%)
          </span>
        </div>
      </div>

      <div className="dashboard-coverage-description">
        <strong>Real:</strong>{" "}
        {data.realSystems.join(", ")}.
        <br />
        <strong>Mock:</strong>{" "}
        {data.mockSystems.join(", ")}.
      </div>
    </div>
  );
}