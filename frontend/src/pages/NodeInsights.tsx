// NodeInsights.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./NodeInsights.css";

interface ApiResponse {
    status: string;
    statusCode: number;
    message: string;
    data?: any;
    timestamp: string;
}

interface PerCheckScoreDiff {
    seoCheck: string;
    scoreDifference: number;
}

interface SeoDifference {
    overallScore?: number;
    perCheckSeoScores: PerCheckScoreDiff[];
}

interface TechnicalSeoDifference {
    meta?: Record<string, any>;
    scores?: {
        performance?: number;
        seo?: number;
        accessibility?: number;
        bestPractices?: number;
    };
    coreWebVitals?: {
        lcp?: number;
        fcp?: number;
        cls?: number;
        tbt?: number;
        speedIndex?: number;
        tti?: number;
    };
    fieldData?: {
        lcpPercentile?: number;
        clsPercentile?: number;
        fidPercentile?: number;
        overallCategory?: string;
    };
    crawlability?: Record<string, any>;
    security?: Record<string, any>;
    structuredData?: boolean;
    diagnostics?: Record<string, any>;
}

interface DomainNodeInsights {
    _id: string;
    domain: string;
    domainNode: string;
    comparedWith: string;
    lastCalculatedAt: string;
    bestPage?: string;
    worstPage?: string;
    seoDifference: SeoDifference;
    technicalSeoDifference: TechnicalSeoDifference;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface PopulatedPage {
    _id: string;
    domainPageUrl?: string;
    seoScore?: number;
    overallScore?: number;
}

const NodeInsights = () => {
    const { nodeId } = useParams<{ nodeId: string }>();
    const navigate = useNavigate();
    const [insights, setInsights] = useState<DomainNodeInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);
    const [error, setError] = useState<string>("");
    const [pollingAttempts, setPollingAttempts] = useState(0);
    const [bestPageDetails, setBestPageDetails] = useState<PopulatedPage | null>(null);
    const [worstPageDetails, setWorstPageDetails] = useState<PopulatedPage | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'seo' | 'technical' | 'pages'>('overview');

    const MAX_POLLING_ATTEMPTS = 15; // 15 attempts * 3 seconds = 45 seconds max
    const POLLING_INTERVAL = 3000; // 3 seconds

    useEffect(() => {
        if (nodeId) {
            fetchInsights();
        }
    }, [nodeId]);

    useEffect(() => {
        let intervalId: number | undefined;

        if (polling && pollingAttempts < MAX_POLLING_ATTEMPTS) {
            intervalId = window.setInterval(() => {
                fetchInsights(true);
            }, POLLING_INTERVAL);
        }

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [polling, pollingAttempts]);

    useEffect(() => {
        if (insights?.bestPage) {
            fetchPageDetails(insights.bestPage, 'best');
        }
        if (insights?.worstPage) {
            fetchPageDetails(insights.worstPage, 'worst');
        }
    }, [insights]);

    const fetchPageDetails = async (pageId: string, type: 'best' | 'worst') => {
        try {
            const token = localStorage.getItem('domainToken');
            const response = await axiosInstance.post<ApiResponse>(
                "/domainPage/findOne",
                { _id: pageId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }
            );

            if (response.data.status === "success") {
                const pageData = response.data.data || response.data;
                if (type === 'best') {
                    setBestPageDetails(pageData);
                } else {
                    setWorstPageDetails(pageData);
                }
            }
        } catch (err) {
            console.error(`Error fetching ${type} page details:`, err);
        }
    };

    const fetchInsights = async (isPolling = false) => {
        if (!nodeId) return;

        if (!isPolling) setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setError("No access token found. Please authenticate.");
                setLoading(false);
                return;
            }
            const response = await axiosInstance.post<ApiResponse>(
                "/domainNodeInsights/findOne",
                { domainNode: nodeId },
                { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
            );

            if (response.data.status === "success") {
                const insightsData = response.data.data || response.data;

                if (insightsData && Object.keys(insightsData).length > 0 && insightsData.seoDifference) {
                    setInsights(insightsData);
                    setPolling(false);
                    setPollingAttempts(0);
                } else {
                    // Start polling if no data yet
                    if (!polling && !isPolling) {
                        setPolling(true);
                        setPollingAttempts(1);
                    } else if (isPolling) {
                        setPollingAttempts(prev => prev + 1);
                    }
                }
            } else if (response.data.statusCode === 404) {
                // If 404, treat as pending and start polling
                if (!polling && !isPolling) {
                    setPolling(true);
                    setPollingAttempts(1);
                } else if (isPolling) {
                    setPollingAttempts(prev => prev + 1);
                }
            } else {
                if (isPolling) {
                    setPollingAttempts(prev => prev + 1);
                } else {
                    setError(response.data.message || "Failed to fetch insights");
                }
            }
        } catch (err: any) {
            if (isPolling) {
                setPollingAttempts(prev => prev + 1);
            } else {
                if (err.code === 'ECONNABORTED') setError("Request timeout. Please try again.");
                else if (err.response?.status === 401) setError("Session expired. Please authenticate again.");
                else setError("Failed to fetch insights");
            }
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    const formatScore = (score?: number) => {
        if (score === undefined || score === null) return "N/A";
        return Number(score).toFixed(1);
    };

    const formatNumber = (num?: number) => {
        if (num === undefined || num === null) return "N/A";
        return Number(num).toFixed(2);
    };

    const getScoreColor = (score?: number) => {
        if (!score) return "#64748b";
        if (score >= 80) return "#10b981";
        if (score >= 60) return "#f59e0b";
        if (score >= 40) return "#f97316";
        return "#ef4444";
    };

    const getDifferenceColor = (diff?: number) => {
        if (!diff) return "#64748b";
        if (diff > 0) return "#10b981";
        if (diff < 0) return "#ef4444";
        return "#64748b";
    };

    const getDifferenceIcon = (diff?: number) => {
        if (!diff) return "➡️";
        if (diff > 0) return "▲";
        if (diff < 0) return "▼";
        return "➡️";
    };

    const getDifferenceText = (diff?: number) => {
        if (!diff) return "No change";
        if (diff > 0) return `+${diff.toFixed(1)} better`;
        return `${diff.toFixed(1)} worse`;
    };

    const retryFetch = () => {
        setPolling(false);
        setPollingAttempts(0);
        fetchInsights();
    };

    if (loading) {
        return (
            <div className="insights-container">
                <nav className="insights-nav">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-text">SEO Crawler</span>
                            <span className="logo-badge">Beta</span>
                        </div>
                        <button
                            className="nav-button"
                            onClick={() => navigate(-1)}
                        >
                            ← Back
                        </button>
                    </div>
                </nav>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading insights...</p>
                </div>
            </div>
        );
    }

    if (polling) {
        const progress = (pollingAttempts / MAX_POLLING_ATTEMPTS) * 100;
        const timeRemaining = ((MAX_POLLING_ATTEMPTS - pollingAttempts) * 3);

        return (
            <div className="insights-container">
                <nav className="insights-nav">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-text">SEO Crawler</span>
                            <span className="logo-badge">Beta</span>
                        </div>
                        <button
                            className="nav-button"
                            onClick={() => navigate(-1)}
                        >
                            ← Back
                        </button>
                    </div>
                </nav>
                <div className="polling-state">
                    <div className="polling-icon">⏳</div>
                    <h3>Generating Insights</h3>
                    <p className="polling-description">
                        We're analyzing your node data. This may take a few moments...
                    </p>
                    <div className="polling-progress-container">
                        <div
                            className="polling-progress-bar"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="polling-details">
                        <span>Attempt {pollingAttempts} of {MAX_POLLING_ATTEMPTS}</span>
                        <span>~{timeRemaining}s remaining</span>
                    </div>
                    {pollingAttempts >= MAX_POLLING_ATTEMPTS && (
                        <div className="polling-timeout">
                            <p>Insights generation is taking longer than expected.</p>
                            <button
                                className="retry-button"
                                onClick={retryFetch}
                            >
                                Retry Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (error || !insights) {
        return (
            <div className="insights-container">
                <nav className="insights-nav">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-text">SEO Crawler</span>
                            <span className="logo-badge">Beta</span>
                        </div>
                        <button
                            className="nav-button"
                            onClick={() => navigate(-1)}
                        >
                            ← Back
                        </button>
                    </div>
                </nav>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Error Loading Insights</h3>
                    <p>{error || "Insights not found"}</p>
                    <button
                        className="retry-button"
                        onClick={retryFetch}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="insights-container">
            {/* Navigation */}
            <nav className="insights-nav">
                <div className="nav-content">
                    <div className="nav-logo">
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                    <div className="nav-actions">
                        <button
                            className="nav-button"
                            onClick={() => navigate(`/nodeDetails/${nodeId}`)}
                        >
                            ← Back to Node
                        </button>
                    </div>
                </div>
            </nav>

            <div className="insights-main">
                {/* Header */}
                <div className="insights-header">
                    <div className="header-left">
                        <h1 className="page-title">Node Insights</h1>
                        <div className="header-meta">
                            <span className="meta-item">
                                <span className="meta-label">Node ID:</span>
                                <span className="meta-value">{insights.domainNode}</span>
                            </span>
                            <span className="meta-item">
                                <span className="meta-label">Compared with:</span>
                                <span className="meta-value">Base Node</span>
                            </span>
                            <span className="meta-item">
                                <span className="meta-label">Last calculated:</span>
                                <span className="meta-value">{formatDate(insights.lastCalculatedAt)}</span>
                            </span>
                        </div>
                    </div>
                    <div className="header-right">
                        <button
                            className="refresh-button"
                            onClick={retryFetch}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="insights-tabs">
                    <button
                        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'seo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('seo')}
                    >
                        SEO Differences
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`}
                        onClick={() => setActiveTab('technical')}
                    >
                        Technical Differences
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'pages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pages')}
                    >
                        Best & Worst Pages
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            {/* Summary Cards */}
                            <div className="summary-cards">
                                <div className="summary-card">
                                    <div className="card-icon">📊</div>
                                    <div className="card-content">
                                        <span className="card-label">Overall SEO Difference</span>
                                        <span
                                            className="card-value"
                                            style={{ color: getDifferenceColor(insights.seoDifference.overallScore) }}
                                        >
                                            {getDifferenceIcon(insights.seoDifference.overallScore)} {formatScore(insights.seoDifference.overallScore)}
                                        </span>
                                        <span className="card-subtitle">
                                            {getDifferenceText(insights.seoDifference.overallScore)}
                                        </span>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="card-icon">🏆</div>
                                    <div className="card-content">
                                        <span className="card-label">Best Page</span>
                                        <span className="card-value">
                                            {bestPageDetails?.domainPageUrl ? (
                                                <span className="page-url">{bestPageDetails.domainPageUrl.substring(0, 30)}...</span>
                                            ) : (
                                                "N/A"
                                            )}
                                        </span>
                                        <span className="card-subtitle">
                                            Score: {formatScore(bestPageDetails?.overallScore || bestPageDetails?.seoScore)}
                                        </span>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="card-icon">📉</div>
                                    <div className="card-content">
                                        <span className="card-label">Worst Page</span>
                                        <span className="card-value">
                                            {worstPageDetails?.domainPageUrl ? (
                                                <span className="page-url">{worstPageDetails.domainPageUrl.substring(0, 30)}...</span>
                                            ) : (
                                                "N/A"
                                            )}
                                        </span>
                                        <span className="card-subtitle">
                                            Score: {formatScore(worstPageDetails?.overallScore || worstPageDetails?.seoScore)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="metrics-section">
                                <h2>Key Performance Indicators</h2>
                                <div className="metrics-grid">
                                    <div className="metric-item">
                                        <span className="metric-label">Performance</span>
                                        <span
                                            className="metric-value"
                                            style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores?.performance) }}
                                        >
                                            {getDifferenceIcon(insights.technicalSeoDifference.scores?.performance)} {formatScore(insights.technicalSeoDifference.scores?.performance)}
                                        </span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">SEO</span>
                                        <span
                                            className="metric-value"
                                            style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores?.seo) }}
                                        >
                                            {getDifferenceIcon(insights.technicalSeoDifference.scores?.seo)} {formatScore(insights.technicalSeoDifference.scores?.seo)}
                                        </span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Accessibility</span>
                                        <span
                                            className="metric-value"
                                            style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores?.accessibility) }}
                                        >
                                            {getDifferenceIcon(insights.technicalSeoDifference.scores?.accessibility)} {formatScore(insights.technicalSeoDifference.scores?.accessibility)}
                                        </span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Best Practices</span>
                                        <span
                                            className="metric-value"
                                            style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores?.bestPractices) }}
                                        >
                                            {getDifferenceIcon(insights.technicalSeoDifference.scores?.bestPractices)} {formatScore(insights.technicalSeoDifference.scores?.bestPractices)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {insights.notes && (
                                <div className="notes-section">
                                    <h2>Insights Notes</h2>
                                    <div className="notes-content">
                                        <p>{insights.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SEO Differences Tab */}
                    {activeTab === 'seo' && (
                        <div className="seo-tab">
                            <div className="seo-header">
                                <h2>SEO Score Differences</h2>
                                <div className="seo-overall">
                                    <span className="overall-label">Overall SEO Difference:</span>
                                    <span
                                        className="overall-value"
                                        style={{ color: getDifferenceColor(insights.seoDifference.overallScore) }}
                                    >
                                        {getDifferenceIcon(insights.seoDifference.overallScore)} {formatScore(insights.seoDifference.overallScore)}
                                    </span>
                                </div>
                            </div>

                            {insights.seoDifference.perCheckSeoScores.length > 0 ? (
                                <div className="per-check-table-container">
                                    <table className="per-check-table">
                                        <thead>
                                            <tr>
                                                <th>SEO Check ID</th>
                                                <th>Score Difference</th>
                                                <th>Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {insights.seoDifference.perCheckSeoScores.map((check, index) => (
                                                <tr key={index}>
                                                    <td className="check-id">{check.seoCheck}</td>
                                                    <td>
                                                        <span
                                                            className="difference-badge"
                                                            style={{
                                                                background: getDifferenceColor(check.scoreDifference),
                                                                color: 'white'
                                                            }}
                                                        >
                                                            {getDifferenceIcon(check.scoreDifference)} {formatScore(check.scoreDifference)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="difference-text">
                                                            {getDifferenceText(check.scoreDifference)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No per-check SEO differences available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Technical Differences Tab */}
                    {activeTab === 'technical' && (
                        <div className="technical-tab">
                            {/* Scores */}
                            {insights.technicalSeoDifference.scores && (
                                <div className="technical-section">
                                    <h2>Score Differences</h2>
                                    <div className="scores-grid">
                                        <div className="score-diff-card">
                                            <span className="diff-label">Performance</span>
                                            <span
                                                className="diff-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores.performance) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.scores.performance)} {formatScore(insights.technicalSeoDifference.scores.performance)}
                                            </span>
                                        </div>
                                        <div className="score-diff-card">
                                            <span className="diff-label">SEO</span>
                                            <span
                                                className="diff-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores.seo) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.scores.seo)} {formatScore(insights.technicalSeoDifference.scores.seo)}
                                            </span>
                                        </div>
                                        <div className="score-diff-card">
                                            <span className="diff-label">Accessibility</span>
                                            <span
                                                className="diff-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores.accessibility) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.scores.accessibility)} {formatScore(insights.technicalSeoDifference.scores.accessibility)}
                                            </span>
                                        </div>
                                        <div className="score-diff-card">
                                            <span className="diff-label">Best Practices</span>
                                            <span
                                                className="diff-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.scores.bestPractices) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.scores.bestPractices)} {formatScore(insights.technicalSeoDifference.scores.bestPractices)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Core Web Vitals */}
                            {insights.technicalSeoDifference.coreWebVitals && (
                                <div className="technical-section">
                                    <h2>Core Web Vitals Differences</h2>
                                    <div className="web-vitals-grid">
                                        <div className="vital-diff-card">
                                            <span className="vital-label">LCP (ms)</span>
                                            <span
                                                className="vital-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.coreWebVitals.lcp) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.coreWebVitals.lcp)} {formatNumber(insights.technicalSeoDifference.coreWebVitals.lcp)}
                                            </span>
                                            <span className="vital-desc">Largest Contentful Paint</span>
                                        </div>
                                        <div className="vital-diff-card">
                                            <span className="vital-label">FCP (ms)</span>
                                            <span
                                                className="vital-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.coreWebVitals.fcp) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.coreWebVitals.fcp)} {formatNumber(insights.technicalSeoDifference.coreWebVitals.fcp)}
                                            </span>
                                            <span className="vital-desc">First Contentful Paint</span>
                                        </div>
                                        <div className="vital-diff-card">
                                            <span className="vital-label">CLS</span>
                                            <span
                                                className="vital-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.coreWebVitals.cls) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.coreWebVitals.cls)} {formatNumber(insights.technicalSeoDifference.coreWebVitals.cls)}
                                            </span>
                                            <span className="vital-desc">Cumulative Layout Shift</span>
                                        </div>
                                        <div className="vital-diff-card">
                                            <span className="vital-label">TBT (ms)</span>
                                            <span
                                                className="vital-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.coreWebVitals.tbt) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.coreWebVitals.tbt)} {formatNumber(insights.technicalSeoDifference.coreWebVitals.tbt)}
                                            </span>
                                            <span className="vital-desc">Total Blocking Time</span>
                                        </div>
                                        <div className="vital-diff-card">
                                            <span className="vital-label">Speed Index (ms)</span>
                                            <span
                                                className="vital-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.coreWebVitals.speedIndex) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.coreWebVitals.speedIndex)} {formatNumber(insights.technicalSeoDifference.coreWebVitals.speedIndex)}
                                            </span>
                                            <span className="vital-desc">Speed Index</span>
                                        </div>
                                        <div className="vital-diff-card">
                                            <span className="vital-label">TTI (ms)</span>
                                            <span
                                                className="vital-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.coreWebVitals.tti) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.coreWebVitals.tti)} {formatNumber(insights.technicalSeoDifference.coreWebVitals.tti)}
                                            </span>
                                            <span className="vital-desc">Time to Interactive</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Field Data */}
                            {insights.technicalSeoDifference.fieldData && (
                                <div className="technical-section">
                                    <h2>Field Data Differences</h2>
                                    <div className="field-data-grid">
                                        <div className="field-diff-card">
                                            <span className="field-label">LCP Percentile</span>
                                            <span
                                                className="field-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.fieldData.lcpPercentile) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.fieldData.lcpPercentile)} {formatNumber(insights.technicalSeoDifference.fieldData.lcpPercentile)}
                                            </span>
                                        </div>
                                        <div className="field-diff-card">
                                            <span className="field-label">CLS Percentile</span>
                                            <span
                                                className="field-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.fieldData.clsPercentile) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.fieldData.clsPercentile)} {formatNumber(insights.technicalSeoDifference.fieldData.clsPercentile)}
                                            </span>
                                        </div>
                                        <div className="field-diff-card">
                                            <span className="field-label">FID Percentile</span>
                                            <span
                                                className="field-value"
                                                style={{ color: getDifferenceColor(insights.technicalSeoDifference.fieldData.fidPercentile) }}
                                            >
                                                {getDifferenceIcon(insights.technicalSeoDifference.fieldData.fidPercentile)} {formatNumber(insights.technicalSeoDifference.fieldData.fidPercentile)}
                                            </span>
                                        </div>
                                        {insights.technicalSeoDifference.fieldData.overallCategory && (
                                            <div className="field-diff-card full-width">
                                                <span className="field-label">Overall Category</span>
                                                <span className={`category-badge ${insights.technicalSeoDifference.fieldData.overallCategory.toLowerCase()}`}>
                                                    {insights.technicalSeoDifference.fieldData.overallCategory}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Best & Worst Pages Tab */}
                    {activeTab === 'pages' && (
                        <div className="pages-tab">
                            <div className="pages-comparison">
                                {/* Best Page */}
                                <div className="best-page-card">
                                    <div className="page-header best">
                                        <span className="page-rank">🏆 Best Page</span>
                                        {bestPageDetails && (
                                            <button
                                                className="view-page-link"
                                                onClick={() => navigate(`/pageDetail/${bestPageDetails._id}`)}
                                            >
                                                View Details →
                                            </button>
                                        )}
                                    </div>
                                    {bestPageDetails ? (
                                        <div className="page-details">
                                            <div className="detail-row">
                                                <span className="detail-label">URL:</span>
                                                <span className="detail-value url">{bestPageDetails.domainPageUrl}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Overall Score:</span>
                                                <span
                                                    className="detail-value score"
                                                    style={{ color: getScoreColor(bestPageDetails.overallScore || bestPageDetails.seoScore) }}
                                                >
                                                    {formatScore(bestPageDetails.overallScore || bestPageDetails.seoScore)}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">SEO Score:</span>
                                                <span className="detail-value">{formatScore(bestPageDetails.seoScore)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="page-placeholder">
                                            <p>Best page details not available</p>
                                        </div>
                                    )}
                                </div>

                                {/* Worst Page */}
                                <div className="worst-page-card">
                                    <div className="page-header worst">
                                        <span className="page-rank">📉 Worst Page</span>
                                        {worstPageDetails && (
                                            <button
                                                className="view-page-link"
                                                onClick={() => navigate(`/pageDetail/${worstPageDetails._id}`)}
                                            >
                                                View Details →
                                            </button>
                                        )}
                                    </div>
                                    {worstPageDetails ? (
                                        <div className="page-details">
                                            <div className="detail-row">
                                                <span className="detail-label">URL:</span>
                                                <span className="detail-value url">{worstPageDetails.domainPageUrl}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Overall Score:</span>
                                                <span
                                                    className="detail-value score"
                                                    style={{ color: getScoreColor(worstPageDetails.overallScore || worstPageDetails.seoScore) }}
                                                >
                                                    {formatScore(worstPageDetails.overallScore || worstPageDetails.seoScore)}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">SEO Score:</span>
                                                <span className="detail-value">{formatScore(worstPageDetails.seoScore)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="page-placeholder">
                                            <p>Worst page details not available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Comparison Summary */}
                            {bestPageDetails && worstPageDetails && (
                                <div className="comparison-summary">
                                    <h3>Comparison Summary</h3>
                                    <div className="comparison-metrics">
                                        <div className="comparison-item">
                                            <span className="comp-label">Score Gap:</span>
                                            <span className="comp-value">
                                                {((bestPageDetails.overallScore || bestPageDetails.seoScore || 0) - (worstPageDetails.overallScore || worstPageDetails.seoScore || 0)).toFixed(1)} points
                                            </span>
                                        </div>
                                        <div className="comparison-item">
                                            <span className="comp-label">Improvement Opportunity:</span>
                                            <span className="comp-value">
                                                {((bestPageDetails.overallScore || bestPageDetails.seoScore || 0) - (worstPageDetails.overallScore || worstPageDetails.seoScore || 0)).toFixed(1)}% potential gain
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NodeInsights;