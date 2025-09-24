import React from 'react';
// Added PieChart, Pie, and Cell for the new pie chart visualization
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GroundwaterData, PredictionData } from '../types';

interface DataVisualizerProps {
  districtData: GroundwaterData[];
  predictionData?: PredictionData;
}

// A helper component to render a single, standardized line chart
const LineChartComponent = ({ data, dataKey, title, color, unit }: { data: GroundwaterData[], dataKey: keyof GroundwaterData, title: string, color: string, unit: string }) => (
    <div className="mb-6">
    <h4 className="text-md font-semibold text-cyan-200 mb-3">{title}</h4>
    <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="Year" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" label={{ value: unit, angle: -90, position: 'insideLeft', fill: '#A0AEC0' }}/>
            <Tooltip
            contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
            labelStyle={{ color: '#E2E8F0' }}
            formatter={(value: number) => `${value.toFixed(2)} ${unit}`}
            />
            <Legend wrapperStyle={{ color: '#E2E8F0' }} />
            <Line type="monotone" dataKey={dataKey} name={title} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }}/>
        </LineChart>
        </ResponsiveContainer>
    </div>
    </div>
);

// Colors for the pie chart slices
const PIE_COLORS = {
    'Safe': '#48BB78', // Tailwind green-500
    'Semi-Critical': '#F6E05E', // Tailwind yellow-400
    'Critical': '#F56565', // Tailwind red-500
};

// Custom label for the pie chart slices to show percentages
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Don't render label if percentage is too small
  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const DataVisualizer: React.FC<DataVisualizerProps> = ({ districtData, predictionData }) => {
  // Data for the prediction line. It connects the last historical point to the predicted point.
  const predictionLineData = predictionData ? [
    districtData[districtData.length - 1],
    // Fulfill the GroundwaterData type for the prediction point
    { ...predictionData, State: '', Soil_type: '', Annual_Extractable_GW_HAM: 0, Status: 'Safe' as const }
  ] : [];

  // Process data for the pie chart to count status occurrences
  const pieData = Object.entries(
    districtData.reduce((acc, curr) => {
        acc[curr.Status] = (acc[curr.Status] || 0) + 1;
        return acc;
    }, {} as Record<GroundwaterData['Status'], number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-gray-800 p-4 rounded-lg my-2 w-full max-w-2xl">
      <h3 className="text-xl font-bold text-cyan-300 mb-6 text-center">{districtData[0].District} Groundwater Trends</h3>
      
      {/* Rationale for Prediction */}
      {predictionData && (
        <div className="mb-8 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <h4 className="text-md font-semibold text-cyan-200 mb-2">Forecast Rationale for {predictionData.Year}</h4>
            <p className="text-sm text-gray-300 italic">"{predictionData.rationale}"</p>
            <p className="text-sm text-gray-300 mt-2">
                <span className="font-bold">Confidence Level:</span> {predictionData.confidence}
            </p>
        </div>
      )}

      {/* Pie Chart for Status Distribution */}
      <div className="mb-8">
        <h4 className="text-md font-semibold text-cyan-200 mb-3 text-center">Status Distribution ({districtData[0].Year} - {districtData[districtData.length - 1].Year})</h4>
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {pieData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                        formatter={(value: number, name: string) => [`${value} year(s)`, name]}
                    />
                    <Legend wrapperStyle={{ color: '#E2E8F0', paddingTop: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      <LineChartComponent data={districtData} dataKey="Rainfall_mm" title="Annual Rainfall" color="#4299E1" unit="mm" />
      <LineChartComponent data={districtData} dataKey="Recharge_MCM" title="Water Recharge" color="#38B2AC" unit="MCM" />
      
      {/* Special chart for Water Level to include prediction */}
      <div className="mb-2">
         <h4 className="text-md font-semibold text-cyan-200 mb-3">Water Level</h4>
         <div className="h-60">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
               <XAxis 
                   dataKey="Year" 
                   type="number"
                   domain={['dataMin', predictionData ? predictionData.Year : 'dataMax']}
                   tickCount={districtData.length + (predictionData ? 1 : 0)}
                   stroke="#A0AEC0" 
                   allowDuplicatedCategory={false}
               />
               <YAxis stroke="#A0AEC0" label={{ value: 'meters', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} domain={['dataMin - 1', 'dataMax + 1']} />
               <Tooltip
                 contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                 labelStyle={{ color: '#E2E8F0' }}
                 formatter={(value: number) => `${value.toFixed(2)} m`}
               />
               <Legend wrapperStyle={{ color: '#E2E8F0' }} />
               <Line data={districtData} type="monotone" dataKey="WaterLevel_m" stroke="#F6E05E" strokeWidth={2} name="Water Level (m)" dot={{ r: 3 }} activeDot={{ r: 6 }} />
               {predictionData && (
                 <Line data={predictionLineData} type="monotone" dataKey="WaterLevel_m" stroke="#F6E05E" strokeDasharray="5 5" name="Predicted Level" dot={{ r: 3 }} activeDot={{ r: 6 }} />
               )}
             </LineChart>
           </ResponsiveContainer>
         </div>
      </div>

    </div>
  );
};

export default DataVisualizer;