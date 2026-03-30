
import RealTimeDashboard from '../../components/activities/RealTimeDashboard'

const EmployeeMainDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">WorkPulse Dashboard (Live)</h1>
      </div>

      {/* Real-Time Activity Monitor */}
      <RealTimeDashboard />
    </div>
  )
}

export default EmployeeMainDashboard
