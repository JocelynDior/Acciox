import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#c026d3', '#7e22ce', '#e879f9', '#a855f7', '#d946ef'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: 10, color: '#fff' }}>
        <p>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>{entry.name}: R {entry.value?.toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const RevenueLineChart = ({ data }) => {
  if (!data || data.length === 0) return <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>No data available yet</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="month" stroke="#fff" />
        <YAxis stroke="#fff" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#c026d3" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" stroke="#7e22ce" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const ExpensePieChart = ({ data }) => {
  if (!data || data.length === 0) return <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>No data available yet</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
          {data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const CashFlowBarChart = ({ data }) => {
  if (!data || data.length === 0) return <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>No data available yet</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="month" stroke="#fff" />
        <YAxis stroke="#fff" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="inflow" fill="#22c55e" />
        <Bar dataKey="outflow" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const MiniLineChart = ({ data, color = '#c026d3' }) => (
  <ResponsiveContainer width="100%" height={60}>
    <LineChart data={data}>
      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);
