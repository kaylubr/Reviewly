function StatCard({ icon, label, value, suffix }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}{suffix ? <span className="stat-suffix"> {suffix}</span> : ''}</p>
      </div>
    </div>
  )
}

export default StatCard
