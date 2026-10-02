import { useEffect, useState } from 'react';
import * as metricsApi from '../api/metrics';
import type { GlobalMetrics, YearMetrics } from '../types';
import { MonthlyBarChart } from '../components/charts/MonthlyBarChart';
import { ReadingVelocityChart } from '../components/charts/ReadingVelocityChart';
import { RatingHistogramChart } from '../components/charts/RatingHistogramChart';
import { TagDistributionChart } from '../components/charts/TagDistributionChart';
import { ReadingHeatmap } from '../components/charts/ReadingHeatmap';
import { WrappedCard } from '../components/charts/WrappedCard';
import { AuthorRankingList } from '../components/charts/AuthorRankingList';
import { YearHistoryChart } from '../components/charts/YearHistoryChart';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export function MetricsView() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [yearMetrics, setYearMetrics] = useState<YearMetrics | null>(null);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);

  useEffect(() => {
    void metricsApi.getYearMetrics(year).then(setYearMetrics);
  }, [year]);

  useEffect(() => {
    void metricsApi.getGlobalMetrics().then(setGlobalMetrics);
  }, []);

  return (
    <div>
      <div className="metrics-head">
        <h1 className="list-head-title">Métricas</h1>
        <div className="metrics-year-picker">
          <label htmlFor="metrics-year">Año</label>
          <select id="metrics-year" className="input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {yearMetrics && (
        <>
          <WrappedCard wrapped={yearMetrics.wrapped} />

          <div className="metrics-grid">
            <div className="metrics-panel">
              <MonthlyBarChart data={yearMetrics.monthlyCounts} />
            </div>
            <div className="metrics-panel">
              <ReadingVelocityChart data={yearMetrics.readingVelocity} />
            </div>
            <div className="metrics-panel">
              <YearHistoryChart history={yearMetrics.yearHistory} />
            </div>
            <div className="metrics-panel">
              <h3 className="chart-title">Sin fecha</h3>
              <p className="undated-note">
                <strong className="tabular">{yearMetrics.undefinedDateCount}</strong>
                {yearMetrics.undefinedDateCount === 1
                  ? 'libro no tiene fecha de lectura asignada y no cuenta en ningún año.'
                  : 'libros no tienen fecha de lectura asignada y no cuentan en ningún año.'}
              </p>
            </div>
          </div>
        </>
      )}

      <h2 className="section-title">Histórico</h2>
      {globalMetrics && (
        <div className="metrics-grid">
          <div className="metrics-panel">
            <AuthorRankingList data={globalMetrics.authorRanking} />
          </div>
          <div className="metrics-panel">
            <RatingHistogramChart data={globalMetrics.ratingHistogram} />
          </div>
          <div className="metrics-panel span-2">
            <TagDistributionChart data={globalMetrics.tagDistribution} />
          </div>
          <div className="metrics-panel span-2">
            <ReadingHeatmap data={globalMetrics.heatmap} />
          </div>
        </div>
      )}
    </div>
  );
}
