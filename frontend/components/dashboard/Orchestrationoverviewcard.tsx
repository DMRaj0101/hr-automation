// Mock data — replace with real orchestrator telemetry when available.
const MOCK_OVERVIEW = {
  totalRequests: 35,
  totalActions: 280,
  completed: 260,
  inProgress: 12,
  pending: 5,
  needsAttention: 3,
};

const FLOW_STEPS = [
  "HRMS",
  "Overall Orchestrator",
  "Decision Agent",
  "Downstream Agents",
  "Enterprise Systems",
  "Status / Monitoring",
];

export function OrchestrationOverviewCard() {
  const {
    totalRequests,
    totalActions,
    completed,
    inProgress,
    pending,
    needsAttention,
  } = MOCK_OVERVIEW;

  const pct = (n: number) => (totalActions > 0 ? (n / totalActions) * 100 : 0);

  return (
    <div className="dashboard-card dashboard-overview-card">
      <div className="dashboard-overview-header">
        <h3 className="dashboard-card-title">Orchestration Overview</h3>

        <button
          type="button"
          className="dashboard-stat-menu"
          aria-label="Orchestration overview options"
        >
          ⋮
        </button>
      </div>

      <div className="dashboard-flow-row">
        {FLOW_STEPS.map((step, i) => (
          <span key={step} className="dashboard-flow-step-wrap">
            <span className="dashboard-flow-step">{step}</span>
            {i < FLOW_STEPS.length - 1 && (
              <span className="dashboard-flow-arrow">→</span>
            )}
          </span>
        ))}
      </div>

      <div className="dashboard-overview-description">
        Receives the lifecycle event from HRMS, coordinates the required
        downstream actions, monitors execution end-to-end, and brings only
        what needs a human decision to this dashboard.
      </div>

      <div className="dashboard-overview-summary-row">
        <span>
          <strong>{totalActions}</strong> downstream actions triggered
        </span>
        <span className="dashboard-overview-summary-muted">
          from {totalRequests} requests
        </span>
      </div>

      <div className="dashboard-overview-bar">
        <div
          className="dashboard-overview-bar-completed"
          style={{ width: `${pct(completed)}%` }}
        />
        <div
          className="dashboard-overview-bar-progress"
          style={{ width: `${pct(inProgress)}%` }}
        />
        <div
          className="dashboard-overview-bar-pending"
          style={{ width: `${pct(pending)}%` }}
        />
        <div
          className="dashboard-overview-bar-attention"
          style={{ width: `${pct(needsAttention)}%` }}
        />
      </div>

      <div className="dashboard-overview-legend">
        <span className="dashboard-overview-legend-item">
          <span className="dashboard-overview-dot dashboard-overview-dot-completed" />
          Completed
        </span>
        <span className="dashboard-overview-legend-item">
          <span className="dashboard-overview-dot dashboard-overview-dot-progress" />
          In progress
        </span>
        <span className="dashboard-overview-legend-item">
          <span className="dashboard-overview-dot dashboard-overview-dot-pending" />
          Pending
        </span>
        <span className="dashboard-overview-legend-item">
          <span className="dashboard-overview-dot dashboard-overview-dot-attention" />
          Needs attention
        </span>
      </div>

      <div className="dashboard-overview-breakdown">
        <div className="dashboard-overview-breakdown-tile">
          <div className="dashboard-overview-breakdown-num dashboard-overview-num-completed">
            {completed}
          </div>
          <div className="dashboard-overview-breakdown-label">Completed</div>
        </div>

        <div className="dashboard-overview-breakdown-tile">
          <div className="dashboard-overview-breakdown-num dashboard-overview-num-progress">
            {inProgress}
          </div>
          <div className="dashboard-overview-breakdown-label">In progress</div>
        </div>

        <div className="dashboard-overview-breakdown-tile">
          <div className="dashboard-overview-breakdown-num dashboard-overview-num-pending">
            {pending}
          </div>
          <div className="dashboard-overview-breakdown-label">Pending</div>
        </div>

        <div className="dashboard-overview-breakdown-tile">
          <div className="dashboard-overview-breakdown-num dashboard-overview-num-attention">
            {needsAttention}
          </div>
          <div className="dashboard-overview-breakdown-label">
            Needs attention
          </div>
        </div>
      </div>
    </div>
  );
}