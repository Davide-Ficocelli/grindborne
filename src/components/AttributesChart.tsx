import { Chart } from "chart.js/auto";
import type { ChartConfiguration } from "chart.js";
import { useRef, useEffect } from "react";

export default function AttributesChart() {
  // This is a reference to the canvas element
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Hard-coded data for the chart
    const data = {
      // The names of your attributes (the "stats")
      labels: [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
      ],
      datasets: [
        {
          label: "My Proficiency",
          // The proficiency values for each attribute
          data: [10, 59, 90, 81, 56, 55],
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
            max: 100,
          },
        },
      },
    };

    // Create the chart on the canvas element
    if (chartRef.current) {
      const myRadarChart = new Chart(chartRef.current, config);

      // Cleanup function to destroy chart when component unmounts
      return () => {
        myRadarChart.destroy();
      };
    }
    return;
  }, []);

  return <canvas id="attributesChart" ref={chartRef}></canvas>;
}
