import { Chart } from "chart.js/auto";
import type { ChartConfiguration } from "chart.js";
import { useRef, useEffect } from "react";
import type { AttributeInDb } from "../types/attribute";

interface AttributesChartProps {
  data: AttributeInDb[] | null;
}

export default function AttributesChart(props: AttributesChartProps) {
  // This is a reference to the canvas element
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // If there is no data or the canvas is not ready, do nothing.
    // This prevents the "vertical line" bug when the component
    // is mounted before the API fetch is complete.
    if (!chartRef.current || !props.data || props.data.length === 0) return;

    const attrLabels: string[] =
      props.data?.map((attr) => attr.name ?? "") ?? [];
    const attrLvlsData: number[] =
      props.data?.map((attr) => attr.level ?? 0) ?? [];

    const data = {
      // The names of your attributes (the "stats")
      labels: attrLabels,
      datasets: [
        {
          label: "La mia maestria",
          // The proficiency values for each attribute
          data: attrLvlsData,
          backgroundColor: "rgba(255, 99, 132, 0.2)", // Fill color
          borderColor: "rgba(255, 99, 132, 1)", // Line color
          pointBackgroundColor: "rgba(255, 99, 132, 1)", // Points color
          borderWidth: 2,
        },
      ],
    };
    const config: ChartConfiguration<"radar", number[], string> = {
      type: "radar",
      data: data,
      options: {
        scales: {
          r: {
            angleLines: {
              display: true,
              color: "rgba(255, 255, 255, 0.1)",
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)", // Very faint white grid
            },
            ticks: {
              // Only show whole numbers on the scale
              stepSize: 20,
              color: "rgba(200, 200, 200, 1)", // A light grey color
              backdropColor: "transparent", // Optional: makes the background behind numbers transparent
            },
            min: 0,
          },
        },
      },
    };

    // Create the chart on the canvas element
    const myRadarChart = new Chart(chartRef.current, config);

    // Cleanup function to destroy chart when component unmounts
    return () => {
      myRadarChart.destroy();
    };
  }, [props.data]);

  // Se i dati sono ancora in fase di caricamento, mostriamo un placeholder
  // In PlayerStatusPage il componente è già sotto Suspense/loading, ma è una sicurezza in più
  if (!props.data || props.data.length === 0) {
    return (
      <div className="w-full md:max-w-md flex justify-center items-center h-64 text-gray-400">
        Nessun attributo da mostrare
      </div>
    );
  }

  return (
    <canvas
      id="attributesChart"
      ref={chartRef}
      className="w-full md:max-w-md"
    ></canvas>
  );
}
