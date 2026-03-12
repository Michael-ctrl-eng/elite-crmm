"use client";
import React, { useEffect, useState } from 'react'
import { useRouter } from "next/navigation"
import { fetchMetricsData } from "../libs/MetricsData"
import Loading from "@/components/ui/Loading"

const colorClasses = [
  "bg-purple-100",
  "bg-red-100",
  "bg-yellow-100",
  "bg-green-100",
]

const DashboardMetrics = ({ range = "this_month" }: { range?: string }) => {
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true)
        const data = await fetchMetricsData(range)
        setMetrics(data)
      } catch (err) {
        console.error('Error loading metrics:', err)
        setError('Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [range])

  if (loading) {
    return (
      <section className="h-[160px] w-auto shadow-sm rounded-xl flex items-center border border-[var(--border-gray)] bg-white opacity-100">
            <Loading
              variant="default"
              size="md"
              label="Loading Stats..."
              className=""
            />
      </section>
    )
  }

  if (error) {
    return (
      <section className="h-[160px] w-auto shadow-sm rounded-xl border border-[var(--border-gray)] bg-white opacity-100">
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[165px] w-full shadow-sm rounded-xl border border-[var(--border-gray)] bg-white opacity-100 overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 h-full">
        {metrics.map((metric, index) => (
          <div key={metric.title} className={`flex flex-col ${index > 0 ? 'border-l border-[var(--border-gray)]' : ''}`}>
            <div className="flex-1 w-full p-3 md:p-4 flex flex-col gap-1 md:gap-2">
              <div className="flex items-start gap-2 md:gap-3">
                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[index % colorClasses.length]}`}>{metric.icon}</div>
                <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
                  <div className="text-xs md:text-sm text-muted-foreground truncate">{metric.title}</div>
                  <div className="text-lg md:text-xl font-semibold text-foreground">{metric.value}</div>
                  <div className={`text-xs ${metric.changeType === "increase" ? "text-green-600" : "text-red-600"}`}>{metric.change}</div>
                </div>
              </div>
            </div>

            <button  onClick={() => router.push("/deals")}
            className="border-t hover:bg-gray-50 border-[var(--border-gray)] px-3 md:px-4 py-2 md:py-3 flex items-center justify-between text-xs md:text-sm font-semibold text-muted-foreground">
              <span>See Details</span>
              <span><img src="/icons/arrow-right.svg" alt="Arrow-Right" className="w-4 h-4" /></span>
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DashboardMetrics
