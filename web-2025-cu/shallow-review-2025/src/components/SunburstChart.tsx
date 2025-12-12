import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../contexts/ThemeContext';
import { buildChartHierarchy, type ChartNode } from '../utils/dataProcessing';
import { applyPaletteToData } from '../utils/colorUtils';

interface SunburstChartProps {
  onNodeClick: (node: ChartNode) => void;
}

export const SunburstChart: React.FC<SunburstChartProps> = ({ onNodeClick }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
      
      // Handle resize
      window.addEventListener('resize', () => {
        chartInstance.current?.resize();
      });

      // Handle click
      chartInstance.current.on('click', (params: any) => {
        if (params.data && params.data.item) {
          onNodeClick(params.data as ChartNode);
        }
      });
    }

    // Prepare data
    const rawData = buildChartHierarchy();
    const data = applyPaletteToData(rawData);

    // Chart Options
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        show: true,
        formatter: (params: any) => {
          const data = params.data as ChartNode;
          return `<div class="echarts-tooltip"><strong>${data.name}</strong></div>`;
        },
        backgroundColor: theme === 'dark' ? 'rgba(50,50,50,0.9)' : 'rgba(255,255,255,0.9)',
        borderColor: theme === 'dark' ? '#555' : '#ccc',
        textStyle: {
          color: theme === 'dark' ? '#fff' : '#333'
        }
      },
      series: [
        {
          type: 'sunburst',
          data: data,
          radius: [0, '90%'],
          label: {
            rotate: 'radial',
            show: true,
            fontSize: 12,
            color: '#fff', // Always white on colored segments? Or adapt?
            textBorderColor: 'rgba(0,0,0,0.5)',
            textBorderWidth: 2,
            formatter: (params: any) => {
              // Hide label if arc is too small?
              return params.name;
            }
          },
          itemStyle: {
            borderRadius: 2,
            borderWidth: 1,
            borderColor: theme === 'dark' ? '#121212' : '#FDFDFD'
          },
          emphasis: {
            focus: 'ancestor'
          },
          levels: [
            {
              r0: '0%',
              r: '15%',
              itemStyle: { borderWidth: 2 },
              label: { rotate: 'radial', fontWeight: 'bold', fontSize: 12 }
            },
            {
              r0: '15%',
              r: '45%',
              itemStyle: { borderWidth: 1 }
            },
            {
              r0: '45%',
              r: '72%',
              itemStyle: { borderWidth: 1 }
            },
            {
              r0: '72%',
              r: '95%',
              itemStyle: { borderWidth: 1 },
              label: { position: 'outside', padding: 3, color: theme === 'dark' ? '#eee' : '#333', textBorderWidth: 0 }
            }
          ]
        }
      ]
    };

    chartInstance.current.setOption(option);

  }, [theme, onNodeClick]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

