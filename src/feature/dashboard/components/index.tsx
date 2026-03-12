"use client";
import React, { useState } from 'react'
import { DashboardHeader } from './DashBoard-header'
import DashboardMetrics from './DashboardMetrics'
import PipelineCard from './PipelineCard'
import RecentActivitiesCard from './RecentActivitiesCard'
import TasksCard from './TasksCard'
import AgendaCard from './AgendaCard'

const DashBoard = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("this-month")

  return (
    <div className='p-3 sm:p-4 md:p-6 flex flex-col gap-3 md:gap-4'>
       <DashboardHeader
         selectedTimePeriod={selectedTimePeriod}
         onTimePeriodChange={setSelectedTimePeriod}
       />
          <DashboardMetrics range={selectedTimePeriod}/>
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[2fr_1fr] gap-3 md:gap-4'>
          <div className='flex flex-col gap-3 md:gap-4'>
            <PipelineCard range={selectedTimePeriod}/>
            <RecentActivitiesCard/>
          </div>
          <div className='flex flex-col gap-3 md:gap-4'>
            <TasksCard/>
            <AgendaCard/>
          </div>
        </div>
    </div>
  )
}

export default DashBoard
