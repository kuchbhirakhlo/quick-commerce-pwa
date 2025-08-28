"use client"

import React from "react"
import {
  BarChart as BarGraph,
  Bar,
  LineChart as LineGraph,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from "recharts"

interface ChartProps {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
  height?: number
}

export function BarChart({
  data,
  index,
  categories,
  colors = ["#2563eb"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40,
  height = 400,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarGraph
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={index}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={yAxisWidth}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          formatter={(value: number) => [valueFormatter(value), ""]}
          labelStyle={{ fontSize: 12, fontWeight: "bold" }}
          itemStyle={{ fontSize: 12 }}
        />
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarGraph>
    </ResponsiveContainer>
  )
}

export function LineChart({
  data,
  index,
  categories,
  colors = ["#2563eb"],
  valueFormatter = (value: number) => `${value}`,
  yAxisWidth = 40,
  height = 400,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineGraph
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={index}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={yAxisWidth}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          formatter={(value: number) => [valueFormatter(value), ""]}
          labelStyle={{ fontSize: 12, fontWeight: "bold" }}
          itemStyle={{ fontSize: 12 }}
        />
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineGraph>
    </ResponsiveContainer>
  )
} 