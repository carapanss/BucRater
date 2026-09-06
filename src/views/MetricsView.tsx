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
      <div className="metrics-year-picker">
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Año</label>
        <select className="input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {yearMetrics && (
        <>
          <div style={{ marginBottom: 18 }}>
            <WrappedCard wrapped={yearMetrics.wrapped} />
          </div>

          <div className="metrics-grid" style={{ marginBottom: 28 }}>
            <div className="card">
              <MonthlyBarChart data={yearMetrics.monthlyCounts} />
            </div>
            <div className="stat-tile" style={{ justifyContent: 'center' }}>
              <span className="stat-value">{yearMetrics.undefinedDateCount}</span>
              <span className="stat-label">Libros sin fecha asignada</span>
            </div>
            <div className="card">
              <ReadingVelocityChart data={yearMetrics.readingVelocity} />
            </div>
            <div className="card">
              <YearHistoryChart history={yearMetrics.yearHistory} />
            </div>
          </div>
        </>
      )}

      <div className="section-title">Histórico</div>
      {globalMetrics && (
        <div className="metrics-grid">
          <div className="card">
            <AuthorRankingList data={globalMetrics.authorRanking} />
          </div>
          <div className="card">
            <RatingHistogramChart data={globalMetrics.ratingHistogram} />
          </div>
          <div className="card span-2">
            <TagDistributionChart data={globalMetrics.tagDistribution} />
          </div>
          <div className="card span-2">
            <ReadingHeatmap data={globalMetrics.heatmap} />
          </div>
        </div>
      )}
    </div>
  );
}
