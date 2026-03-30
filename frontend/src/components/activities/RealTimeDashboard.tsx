
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityApi, BatchActivityResponse } from '../../api/activity'
import { sessionsApi } from '../../api/sessions'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Activity, Clock, MousePointer, Monitor, Image as ImageIcon } from 'lucide-react'

const RealTimeDashboard = () => {
    // 1. Get Active Session
    const { data: sessionData, isLoading: isLoadingSession } = useQuery({
        queryKey: ['activeSession'],
        queryFn: sessionsApi.getActive,
        refetchInterval: 30000 // Check for session status every 30s
    })

    const sessionId = sessionData?.session?.id

    // 2. Get Batch Activity for Session
    const { data: activityData, isLoading: isLoadingActivity } = useQuery({
        queryKey: ['batchActivity', sessionId],
        queryFn: () => activityApi.getBatchActivity(sessionId!),
        enabled: !!sessionId,
        refetchInterval: 60000 // Refresh data every minute
    })

    if (isLoadingSession) return <div>Loading session...</div>

    if (!sessionId) {
        return (
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-gray-500">
                    <Monitor className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No Active Session</h3>
                    <p>Start tracking from the Desktop Agent to see real-time data.</p>
                </CardContent>
            </Card>
        )
    }

    if (isLoadingActivity) return <div>Loading activity data...</div>

    // Prepare Chart Data
    const summary = activityData?.summary || { totalActiveSeconds: 0, totalIdleSeconds: 0, totalMouseEvents: 0, totalKeyboardEvents: 0 }

    const pieData = [
        { name: 'Active', value: summary.totalActiveSeconds, color: '#22c55e' }, // green-500
        { name: 'Idle', value: summary.totalIdleSeconds, color: '#eab308' }   // yellow-500
    ]

    const latestScreenshot = summary.screenshots && summary.screenshots.length > 0
        ? summary.screenshots[0]
        : null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center">
                    <Activity className="mr-2 h-6 w-6 text-blue-600" />
                    Live Session Monitor
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Session ID: {sessionId}
                    </div>
                    <div className="flex items-center">
                        <span className="animate-pulse h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Live
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Activity Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${(value / 60).toFixed(1)} mins`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Input Events */}
                <Card>
                    <CardHeader>
                        <CardTitle>Input Events</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center h-64 space-y-8">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center">
                                <MousePointer className="h-8 w-8 text-blue-500 mr-4" />
                                <div>
                                    <p className="text-sm text-gray-500">Mouse Events</p>
                                    <p className="text-2xl font-bold">{summary.totalMouseEvents}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center">
                                <Monitor className="h-8 w-8 text-purple-500 mr-4" />
                                <div>
                                    <p className="text-sm text-gray-500">Keyboard Events</p>
                                    <p className="text-2xl font-bold">{summary.totalKeyboardEvents}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Latest Screenshot */}
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Screenshot</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center bg-gray-100 rounded-md overflow-hidden relative group">
                        {latestScreenshot ? (
                            <>
                                <img
                                    src={latestScreenshot.imageUrl}
                                    alt="Latest Screenshot"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                    {new Date(latestScreenshot.timestamp).toLocaleTimeString()}
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400">
                                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No screenshots yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Hourly Timeline */}
            {activityData?.hourlyActivity && activityData.hourlyActivity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline (Active vs Idle)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData.hourlyActivity}>
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="activeSeconds" name="Active (sec)" fill="#22c55e" stackId="a" />
                                <Bar dataKey="idleSeconds" name="Idle (sec)" fill="#eab308" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Log Table (Optional - maybe just top apps?) */}
            {activityData?.aggregatedData && activityData.aggregatedData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-gray-500 border-b">
                                    <tr>
                                        <th className="py-2">Time</th>
                                        <th className="py-2">Active App</th>
                                        <th className="py-2 text-right">Active (s)</th>
                                        <th className="py-2 text-right">Idle (s)</th>
                                        <th className="py-2 text-right">Mouse</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...activityData.aggregatedData].reverse().slice(0, 5).map((log) => (
                                        <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-3">{new Date(log.fullTimestamp).toLocaleTimeString()}</td>
                                            <td className="py-3 font-medium">{log.activeWindowTitle || 'Unknown'}</td>
                                            <td className="py-3 text-right text-green-600">{log.activeSeconds.toFixed(0)}</td>
                                            <td className="py-3 text-right text-yellow-600">{log.idleSeconds.toFixed(0)}</td>
                                            <td className="py-3 text-right">{log.mouseEvents}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default RealTimeDashboard
