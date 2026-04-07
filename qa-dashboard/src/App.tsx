import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3, CheckCircle, XCircle, Download, ShieldCheck, AlertTriangle,
  Search, Filter, ChevronDown, ChevronRight, Clock, Calendar, Eye, X,
  AlertCircle, Smartphone, Monitor, ArrowUpRight, Zap, Bug, Lightbulb
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './App.css'

// ─── Types ───
interface TestDetail {
  id: string; test: string; suite: string; pageArea: string; feature: string;
  viewport: 'Desktop' | 'Mobile' | 'Both'; status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number; errorType?: string; rawError?: string; humanError?: string;
  recommendation?: string; priority?: string; screenshots?: string[];
  annotations?: Array<{ type: string; description: string }>;
}
interface Suite { name: string; pageArea: string; passed: number; failed: number; skipped: number; flaky: number; duration: number; }
interface QASummary {
  timestamp: string; duration: number;
  totals: { passed: number; failed: number; skipped: number; flaky: number; total: number };
  suites: Suite[]; tests: TestDetail[]; pageAreas: string[]; features: string[];
}

type View = 'overview' | 'areas' | 'failures' | 'all-tests';
type ViewportFilter = 'all' | 'Desktop' | 'Mobile';

// ─── Constants ───
const PAGE_AREA_ICONS: Record<string, string> = {
  'Homepage': '🏠', 'Global': '🌐', 'Announcement Bar': '📢', 'Footer': '🦶',
  'Collection': '🗂️', 'PDP': '📦', 'Cart': '🛒', 'Login': '🔐', 'Landing Page': '📄',
};
const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const CHART_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#94A3B8'];

function formatDuration(ms: number): string { return ms >= 60000 ? (ms / 60000).toFixed(1) + 'm' : (ms / 1000).toFixed(1) + 's'; }
function getNextMonday(): string {
  const now = new Date(); const day = now.getDay();
  const d = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  const next = new Date(now); next.setDate(now.getDate() + d); next.setHours(8, 0, 0, 0);
  return next.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// ─── App ───
function App() {
  const [data, setData] = useState<QASummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('overview');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [viewportFilter, setViewportFilter] = useState<ViewportFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetch('/latest.json').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // ─── Derived ───
  const passRate = useMemo(() => data && data.totals.total > 0 ? Math.round((data.totals.passed / data.totals.total) * 100) : 0, [data]);
  const health = useMemo(() => {
    if (passRate >= 90) return { label: 'Healthy', color: '#10B981', bg: '#ECFDF5' };
    if (passRate >= 70) return { label: 'Needs Attention', color: '#F59E0B', bg: '#FFFBEB' };
    return { label: 'Critical Issues', color: '#EF4444', bg: '#FEF2F2' };
  }, [passRate]);

  const failedTests = useMemo(() => (data?.tests || []).filter(t => t.status === 'failed'), [data]);
  const passedTests = useMemo(() => (data?.tests || []).filter(t => t.status === 'passed'), [data]);

  // Group by page area
  const areaGroups = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { area: string; tests: TestDetail[]; passed: number; failed: number }>();
    data.tests.forEach(t => {
      if (!map.has(t.pageArea)) map.set(t.pageArea, { area: t.pageArea, tests: [], passed: 0, failed: 0 });
      const g = map.get(t.pageArea)!;
      g.tests.push(t);
      if (t.status === 'passed' || t.status === 'flaky') g.passed++;
      if (t.status === 'failed') g.failed++;
    });
    return Array.from(map.values()).sort((a, b) => b.failed - a.failed || a.area.localeCompare(b.area));
  }, [data]);

  const areaChartData = useMemo(() => areaGroups.map(g => ({
    name: g.area, passed: g.passed, failed: g.failed,
  })), [areaGroups]);

  // Sorted failures by priority
  const prioritizedFailures = useMemo(() => {
    let tests = failedTests;
    if (selectedArea) tests = tests.filter(t => t.pageArea === selectedArea);
    if (viewportFilter !== 'all') tests = tests.filter(t => t.viewport === viewportFilter);
    if (searchQuery) tests = tests.filter(t =>
      t.test.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pageArea.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...tests].sort((a, b) => (PRIORITY_ORDER[a.priority || 'medium'] ?? 2) - (PRIORITY_ORDER[b.priority || 'medium'] ?? 2));
  }, [failedTests, selectedArea, viewportFilter, searchQuery]);

  // All tests filtered
  const filteredAllTests = useMemo(() => {
    let tests = data?.tests || [];
    if (selectedArea) tests = tests.filter(t => t.pageArea === selectedArea);
    if (viewportFilter !== 'all') tests = tests.filter(t => t.viewport === viewportFilter);
    if (searchQuery) tests = tests.filter(t =>
      t.test.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.feature.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return tests;
  }, [data, selectedArea, viewportFilter, searchQuery]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Passed', value: data.totals.passed },
      { name: 'Failed', value: data.totals.failed },
      ...(data.totals.flaky > 0 ? [{ name: 'Flaky', value: data.totals.flaky }] : []),
    ].filter(d => d.value > 0);
  }, [data]);

  // ─── Export ───
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [['Page/Area', 'Feature', 'Test Name', 'Viewport', 'Status', 'Priority', 'What Happened', 'Recommendation']];
    data.tests.forEach(t => {
      rows.push([t.pageArea, t.feature, t.test, t.viewport, t.status, t.priority || '', t.humanError || '', t.recommendation || '']);
    });
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `dermalogica-qa-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  // ─── Render Helpers ───
  const PriorityBadge = ({ priority }: { priority?: string }) => {
    const colors: Record<string, { bg: string; text: string }> = {
      critical: { bg: '#FEE2E2', text: '#991B1B' }, high: { bg: '#FFEDD5', text: '#9A3412' },
      medium: { bg: '#FEF3C7', text: '#92400E' }, low: { bg: '#F0F9FF', text: '#075985' },
    };
    const c = colors[priority || 'medium'] || colors.medium;
    return <span className="badge" style={{ background: c.bg, color: c.text }}>{priority || 'medium'}</span>;
  };

  const ViewportBadge = ({ viewport }: { viewport: string }) => (
    <span className="viewport-badge">
      {viewport === 'Mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
      {viewport}
    </span>
  );

  const ErrorTypeIcon = ({ type }: { type?: string }) => {
    if (type === 'timeout') return <Clock size={14} color="#F59E0B" />;
    if (type === 'selector_not_found') return <Eye size={14} color="#EF4444" />;
    if (type === 'page_crashed') return <Zap size={14} color="#EF4444" />;
    return <Bug size={14} color="#6B7280" />;
  };

  // ─── Loading/Empty ───
  if (loading) return <div className="layout"><div className="loading-screen"><div className="loading-spinner" /><p>Loading QA report…</p></div></div>;
  if (!data) return <div className="layout"><div className="loading-screen"><AlertTriangle size={48} color="#9CA3AF" /><p style={{ marginTop: '1rem' }}>No data found. Run the test suite first.</p></div></div>;

  return (
    <div className="layout">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-brand"><ShieldCheck size={26} strokeWidth={1.5} /><h2>QA Dashboard</h2></div>

        <div className="sidebar-section-label">Views</div>
        <nav>
          <div className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => { setView('overview'); setSelectedArea(null); }}>
            <BarChart3 size={18} /><span>Overview</span>
          </div>
          <div className={`nav-item ${view === 'areas' ? 'active' : ''}`} onClick={() => { setView('areas'); setSelectedArea(null); }}>
            <Filter size={18} /><span>By Page / Area</span>
          </div>
          <div className={`nav-item ${view === 'failures' ? 'active' : ''}`} onClick={() => { setView('failures'); setSelectedArea(null); }}>
            <AlertCircle size={18} /><span>Fix Next</span>
            {failedTests.length > 0 && <span className="badge badge-error">{failedTests.length}</span>}
          </div>
          <div className={`nav-item ${view === 'all-tests' ? 'active' : ''}`} onClick={() => { setView('all-tests'); setSelectedArea(null); }}>
            <CheckCircle size={18} /><span>All Tests</span>
          </div>
        </nav>

        <div className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Page / Area</div>
        <nav>
          {areaGroups.map(g => (
            <div key={g.area} className={`nav-item nav-item-area ${selectedArea === g.area ? 'active' : ''}`}
              onClick={() => { setSelectedArea(selectedArea === g.area ? null : g.area); if (view === 'overview') setView('areas'); }}>
              <span className="area-icon">{PAGE_AREA_ICONS[g.area] || '📋'}</span>
              <span style={{ flex: 1 }}>{g.area}</span>
              {g.failed > 0 && <span className="badge badge-error-sm">{g.failed}</span>}
              {g.failed === 0 && <CheckCircle size={14} color="var(--success)" />}
            </div>
          ))}
        </nav>

        <div className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>Schedule</div>
        <div className="sidebar-info-card">
          <Calendar size={16} color="#6B7280" />
          <div>
            <p className="info-value">{getNextMonday()}</p>
            <p className="info-label">8:00 AM PST · Weekly</p>
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="main-content">
        <header className="header">
          <div className="flex items-center gap-4">
            <h1 className="header-title">
              {view === 'overview' && 'Product Quality Overview'}
              {view === 'areas' && (selectedArea ? `${PAGE_AREA_ICONS[selectedArea] || ''} ${selectedArea}` : 'Page / Area Breakdown')}
              {view === 'failures' && '🔧 Fix Next — Prioritized Issues'}
              {view === 'all-tests' && 'All Test Results'}
            </h1>
          </div>
          <div className="flex gap-2">
            <div className="viewport-toggle">
              {(['all', 'Desktop', 'Mobile'] as ViewportFilter[]).map(v => (
                <button key={v} className={`pill ${viewportFilter === v ? 'pill-active' : ''}`} onClick={() => setViewportFilter(v)}>
                  {v === 'all' ? 'All' : v === 'Desktop' ? <><Monitor size={13} /> Desktop</> : <><Smartphone size={13} /> Mobile</>}
                </button>
              ))}
            </div>
            <button className="btn-secondary" onClick={handleExportCSV}><Download size={15} />Export CSV</button>
          </div>
        </header>

        <section className="content-body">
          {/* ═══ OVERVIEW ═══ */}
          {view === 'overview' && (
            <>
              <div className="health-banner" style={{ borderLeftColor: health.color, backgroundColor: health.bg }}>
                <div>
                  <h1 className="health-title" style={{ color: health.color }}>{passRate >= 90 ? '✅' : passRate >= 70 ? '⚠️' : '🔴'} Dermalogica.com — {health.label}</h1>
                  <p className="health-meta"><Clock size={14} /> Scanned {new Date(data.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {formatDuration(data.duration)} total run time</p>
                </div>
                <div className="health-rate"><span className="health-rate-num" style={{ color: health.color }}>{passRate}%</span><span className="health-rate-label">pass rate</span></div>
              </div>

              <div className="overview-grid">
                <div className="stat-cards-col">
                  <div className="stat-row">
                    <div className="stat-card"><p className="stat-label">Total Tests</p><h2 className="stat-value">{data.totals.total}</h2></div>
                    <div className="stat-card"><p className="stat-label"><CheckCircle size={14} color="var(--success)" style={{ verticalAlign: 'text-bottom' }} /> Passed</p><h2 className="stat-value" style={{ color: 'var(--success)' }}>{data.totals.passed}</h2></div>
                    <div className="stat-card"><p className="stat-label"><XCircle size={14} color="var(--error)" style={{ verticalAlign: 'text-bottom' }} /> Failed</p><h2 className="stat-value" style={{ color: data.totals.failed > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{data.totals.failed}</h2></div>
                  </div>
                </div>
                <div className="chart-col">
                  <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1rem' }}>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value" stroke="none">
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                      </Pie><Tooltip formatter={(v: number, n: string) => [`${v} tests`, n]} /></PieChart>
                    </ResponsiveContainer>
                    <div className="chart-legend">{pieData.map((d, i) => <div key={i} className="legend-item"><span className="legend-dot" style={{ backgroundColor: CHART_COLORS[i] }} /><span>{d.name}: {d.value}</span></div>)}</div>
                  </div>
                </div>
              </div>

              {/* Area Bar Chart */}
              <div style={{ marginTop: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Results by Page / Area</h2>
                <div className="card" style={{ padding: '1rem 0.5rem' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={areaChartData} layout="vertical" margin={{ left: 120, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
                      <Tooltip />
                      <Bar dataKey="passed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} name="Passed" />
                      <Bar dataKey="failed" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Issues Preview */}
              {prioritizedFailures.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <div className="section-header"><h2>🔧 Top Issues to Fix</h2><button className="btn-link" onClick={() => setView('failures')}>View all {failedTests.length} →</button></div>
                  {prioritizedFailures.slice(0, 4).map(t => (
                    <div key={t.id} className="issue-card" onClick={() => { setView('failures'); setExpandedTest(t.id); }}>
                      <div className="issue-card-left">
                        <ErrorTypeIcon type={t.errorType} />
                        <div><p className="issue-test">{t.test}</p><p className="issue-meta">{PAGE_AREA_ICONS[t.pageArea] || ''} {t.pageArea} · {t.feature}</p></div>
                      </div>
                      <div className="issue-card-right"><PriorityBadge priority={t.priority} /><ViewportBadge viewport={t.viewport} /><ArrowUpRight size={14} color="#9CA3AF" /></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ BY AREA ═══ */}
          {view === 'areas' && !selectedArea && (
            <div className="area-grid">
              {areaGroups.map(g => {
                const total = g.passed + g.failed;
                const rate = total > 0 ? Math.round((g.passed / total) * 100) : 0;
                return (
                  <div key={g.area} className="area-card" onClick={() => setSelectedArea(g.area)}>
                    <div className="area-card-head">
                      <span className="area-card-icon">{PAGE_AREA_ICONS[g.area] || '📋'}</span>
                      <span className={`badge ${g.failed > 0 ? 'badge-error' : 'badge-success'}`}>{g.failed > 0 ? `${g.failed} issues` : 'All clear'}</span>
                    </div>
                    <h3 className="area-card-title">{g.area}</h3>
                    <p className="area-card-subtitle">{total} tests · {g.passed} passed</p>
                    <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${rate}%`, backgroundColor: rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--error)' }} /></div>
                    <p className="area-card-rate">{rate}% pass rate</p>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'areas' && selectedArea && (
            <>
              <button className="btn-link" onClick={() => setSelectedArea(null)} style={{ marginBottom: '1rem' }}>← Back to all areas</button>
              <div style={{ marginBottom: '1.5rem' }}>
                {(() => { const g = areaGroups.find(a => a.area === selectedArea); const total = (g?.passed || 0) + (g?.failed || 0); const rate = total > 0 ? Math.round(((g?.passed || 0) / total) * 100) : 0;
                  return (<div className="area-detail-header"><div><h2 style={{ fontSize: '1.5rem' }}>{PAGE_AREA_ICONS[selectedArea]} {selectedArea}</h2><p>{total} tests · {g?.passed} passed · {g?.failed} failed</p></div><div className="area-detail-rate" style={{ color: rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--error)' }}>{rate}%</div></div>);
                })()}
              </div>
              {renderTestTable(data.tests.filter(t => t.pageArea === selectedArea).filter(t => viewportFilter === 'all' || t.viewport === viewportFilter))}
            </>
          )}

          {/* ═══ FIX NEXT ═══ */}
          {view === 'failures' && (
            <>
              <div className="toolbar">
                <div className="search-box"><Search size={16} color="#9CA3AF" /><input placeholder="Search issues…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />{searchQuery && <X size={14} className="search-clear" onClick={() => setSearchQuery('')} />}</div>
                <div className="filter-group">
                  <div className="filter-dropdown" onClick={() => setShowFilterMenu(!showFilterMenu)}><Filter size={14} /><span>{selectedArea || 'All areas'}</span><ChevronDown size={14} /></div>
                  {showFilterMenu && (
                    <div className="filter-menu"><div className="filter-menu-item" onClick={() => { setSelectedArea(null); setShowFilterMenu(false); }}>All areas</div>
                      {(data.pageAreas || []).map(a => <div key={a} className="filter-menu-item" onClick={() => { setSelectedArea(a); setShowFilterMenu(false); }}>{PAGE_AREA_ICONS[a] || ''} {a}</div>)}
                    </div>
                  )}
                </div>
              </div>
              <p style={{ marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Sorted by priority. <strong style={{ color: 'var(--text-primary)' }}>{prioritizedFailures.length}</strong> issue{prioritizedFailures.length !== 1 ? 's' : ''} to review.
              </p>
              {prioritizedFailures.length === 0 ? (
                <div className="empty-state"><CheckCircle size={48} color="var(--success)" /><h2>No issues found!</h2><p>All tests matching your filters are passing.</p></div>
              ) : prioritizedFailures.map(t => {
                const isOpen = expandedTest === t.id;
                return (
                  <div key={t.id} className={`failure-card ${isOpen ? 'expanded' : ''}`}>
                    <div className="failure-card-header" onClick={() => setExpandedTest(isOpen ? null : t.id)}>
                      <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <ErrorTypeIcon type={t.errorType} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p className="failure-test-name">{t.test}</p>
                          <p className="failure-suite-name">{PAGE_AREA_ICONS[t.pageArea] || ''} {t.pageArea} › {t.feature}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2"><PriorityBadge priority={t.priority} /><ViewportBadge viewport={t.viewport} /></div>
                    </div>
                    {isOpen && (
                      <div className="failure-card-body">
                        <div className="fix-guidance">
                          <div className="fix-guidance-item"><div className="fix-icon-wrap" style={{ background: '#FEF2F2' }}><Bug size={16} color="var(--error)" /></div><div><p className="fix-label">What happened</p><p className="fix-text">{t.humanError}</p></div></div>
                          <div className="fix-guidance-item"><div className="fix-icon-wrap" style={{ background: '#EEF2FF' }}><Lightbulb size={16} color="var(--indigo)" /></div><div><p className="fix-label">How to fix it</p><p className="fix-text">{t.recommendation}</p></div></div>
                        </div>
                        {t.annotations && t.annotations.length > 0 && (
                          <div className="failure-annotations">{t.annotations.map((a, j) => <div key={j} className="annotation-chip"><span className="annotation-type">{a.type}</span><span>{a.description}</span></div>)}</div>
                        )}
                        <details className="raw-error-details"><summary>View raw error log</summary><pre className="failure-error-pre">{(t.rawError || '').replace(/\u001b\[[0-9;]*m/g, '').substring(0, 500)}</pre></details>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ═══ ALL TESTS ═══ */}
          {view === 'all-tests' && (
            <>
              <div className="toolbar">
                <div className="search-box"><Search size={16} color="#9CA3AF" /><input placeholder="Search all tests…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />{searchQuery && <X size={14} className="search-clear" onClick={() => setSearchQuery('')} />}</div>
                <div className="filter-group">
                  <div className="filter-dropdown" onClick={() => setShowFilterMenu(!showFilterMenu)}><Filter size={14} /><span>{selectedArea || 'All areas'}</span><ChevronDown size={14} /></div>
                  {showFilterMenu && (
                    <div className="filter-menu"><div className="filter-menu-item" onClick={() => { setSelectedArea(null); setShowFilterMenu(false); }}>All areas</div>
                      {(data.pageAreas || []).map(a => <div key={a} className="filter-menu-item" onClick={() => { setSelectedArea(a); setShowFilterMenu(false); }}>{PAGE_AREA_ICONS[a] || ''} {a}</div>)}
                    </div>
                  )}
                </div>
              </div>
              <p style={{ marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredAllTests.length}</strong> test result{filteredAllTests.length !== 1 ? 's' : ''}
              </p>
              {renderTestTable(filteredAllTests)}
            </>
          )}
        </section>
      </main>
    </div>
  );

  // ─── Shared Table Renderer ───
  function renderTestTable(tests: TestDetail[]) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Test</th><th>Feature</th><th>Viewport</th><th>Status</th><th>Duration</th></tr></thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.id} className={`table-row-hover ${t.status === 'failed' ? 'row-failed' : ''}`}
                onClick={() => { if (t.status === 'failed') { setExpandedTest(t.id); setView('failures'); } }}>
                <td className="cell-name">{t.test}</td>
                <td className="cell-muted">{t.feature}</td>
                <td><ViewportBadge viewport={t.viewport} /></td>
                <td>
                  {t.status === 'passed' && <span className="badge badge-success">Passed</span>}
                  {t.status === 'failed' && <span className="badge badge-error">Failed</span>}
                  {t.status === 'flaky' && <span className="badge badge-warning">Flaky</span>}
                  {t.status === 'skipped' && <span className="badge" style={{ background: '#F1F5F9', color: '#64748B' }}>Skipped</span>}
                </td>
                <td className="cell-muted">{formatDuration(t.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App
