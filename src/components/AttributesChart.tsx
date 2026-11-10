import { Chart } from "chart.js/auto";
import type { ChartConfiguration } from "chart.js";
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { AttributeInDb } from "../types/attribute";

// Minimum number of axes for a meaningful radar chart.
// 1 axis → a point, 2 axes → a line. Neither is readable as "comparison".
// 3 is the smallest polygon a radar chart can draw.
const MIN_ATTRIBUTES_FOR_CHART = 3;

interface AttributesChartProps {
  data: AttributeInDb[] | null;
}

export default function AttributesChart(props: AttributesChartProps) {
  const { t } = useTranslation();

  // This is a reference to the canvas element
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  // DECISION: the ">= 3 attributes" rule lives HERE, not in the parent.
  // The chart is the only consumer that cares about the minimum for a
  // readable radar, so the rule belongs close to it. Moving it to
  // PlayerStatusPage would duplicate the threshold and risk drift.
  const shouldRenderChart =
    !!props.data && props.data.length >= MIN_ATTRIBUTES_FOR_CHART;

  // How many attributes are still missing before the chart can appear.
  // When data is empty, 3 - 0 = 3 (per spec: "aggiungine altri 3").
  // When 1 attribute exists, 3 - 1 = 2 (plural form).
  // When 2 attributes exist, 3 - 2 = 1 (singular form, see i18n _one).
  const missingCount = props.data
    ? Math.max(0, MIN_ATTRIBUTES_FOR_CHART - props.data.length)
    : MIN_ATTRIBUTES_FOR_CHART;

  useEffect(() => {
    // Only build the chart when we actually need it AND the canvas is
    // mounted. When data drops below MIN_ATTRIBUTES_FOR_CHART, the canvas
    // is removed from the DOM; the cleanup below (registered on a
    // previous render) destroys the chart instance before that happens.
    if (
      !shouldRenderChart ||
      !chartRef.current ||
      !props.data ||
      props.data.length === 0
    )
      return;

    const attrLabels: string[] = props.data.map((attr) => attr.name ?? "");
    const attrLvlsData: number[] = props.data.map((attr) => attr.level ?? 0);

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
    // (or when data changes to a state where the chart should not render).
    return () => {
      myRadarChart.destroy();
    };
  }, [props.data, shouldRenderChart]);

  // Placeholder when there are not enough attributes yet. The text is
  // dynamic: it tells the user how many more attributes are needed for
  // the chart to appear. The count is passed to i18next, which picks the
  // singular/plural form automatically (see locales).
  if (!shouldRenderChart) {
    return (
      <div className="w-full md:max-w-md flex justify-center items-center h-64 text-gray-400 text-center px-4">
        {t("playerStatusPage.chartPlaceholder.notEnoughAttributes", {
          count: missingCount,
        })}
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
