import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./AiSummary.css";
interface SummaryResponse {
    summary?: {
        title: string;
        content: string;
        keyPoints: string[];
        seoScore?: number;
        wordCount?: number;
        readabilityScore?: number;
        sentiment?: string;
    };
    page?: {
        url: string;
        title: string;
        crawledAt: string;
    };
    error?: string;
}
const AiSummary = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string>("");
    const [summary, setSummary] = useState<SummaryResponse["summary"] | null>(null);
    const [page, setPage] = useState<SummaryResponse["page"] | null>(null); 
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'summary' | 'keyPoints' | 'analysis'>('summary');
    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        fetchSummary();

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [id]);
    const fetchSummary = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("domainToken");

            if (!token) {
                setError("No access token found. Please add a domain first.");
                setLoading(false);
                return;
            }
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            pollingInterval.current = setInterval(async () => {
                try {
                    const response = await axiosInstance.post<SummaryResponse>(
                        "/domainPage/getAiSummary",
                        { domainPageId: id },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const data = response.data;
                    if (data.summary) {
                        setSummary(data.summary);
                        setPage(data.page ?? null);
                        setLoading(false);
                        if (pollingInterval.current) clearInterval(pollingInterval.current);
                    } else if (data.error?.includes("PROCESSING") || !data.summary) {
                        // still processing, do nothing, keep loading true
                        setLoading(true);
                    } else if (data.error) {
                        setError(data.error);
                        setLoading(false);
                        if (pollingInterval.current) clearInterval(pollingInterval.current);
                    }
                } catch (err: any) {
                    setError(err.response?.data?.error || "Network error occurred");
                    setLoading(false);
                    if (pollingInterval.current) clearInterval(pollingInterval.current);
                }
            }, 3000); 
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Session expired. Please add your domain again.");
            } else if (err.response?.status === 404) {
                setError("Page not found");
            } else {
                setError(err.response?.data?.error || "Network error occurred");
            }
            setLoading(false);
        }
    };
    const handleRegenerate = () => {
        setSummary(null);
        setError("");
        fetchSummary();
    };
    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment?.toLowerCase()) {
            case "positive":
                return "#22c55e";
            case "negative":
                return "#ef4444";
            case "neutral":
                return "#f59e0b";
            default:
                return "#64748b";
        }
    };
    return (
        <div className="summary-container">
            {/* Navigation */}
            <nav className="nav-bar">
                <div className="nav-content">
                    <div className="nav-logo">
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                    <div className="nav-actions">
                        <button
                            className="nav-button secondary"
                            onClick={() => navigate('/createDomain')}
                        >
                            ← Add Domain
                        </button>
                        <button
                            className="nav-button primary"
                            onClick={() => navigate('/getYourPages')}
                        >
                            View Pages →
                        </button>
                    </div>
                </div>
            </nav>
            <div className="main-content">
                <div className="header-section">
                    <div className="header-left">
                        <h1 className="page-title">AI Page Summary</h1>
                        <p className="page-subtitle">
                            Intelligent analysis and summary of your crawled page
                        </p>
                    </div>
                    <button
                        className="regenerate-button"
                        onClick={handleRegenerate}
                        disabled={loading}
                    >
                        <span className="button-icon">⟳</span>
                        {loading ? 'Generating...' : 'Regenerate Summary'}
                    </button>
                </div>
                {page && (
                    <div className="page-info-card">
                        <div className="page-info-icon">📄</div>
                        <div className="page-info-content">
                            <h3>{page.title || 'Untitled Page'}</h3>
                            <a href={page.url} target="_blank" rel="noopener noreferrer" className="page-url">
                                {page.url}
                            </a>
                            <div className="page-meta">
                                <span className="crawled-date">
                                    Crawled: {new Date(page.crawledAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>AI is analyzing your page...</p>
                        <p className="loading-subtext">This may take a few moments</p>
                    </div>
                )}
                {error && !loading && (
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Unable to generate summary</h3>
                        <p>{error}</p>
                        <div className="error-actions">
                            <button
                                className="retry-button"
                                onClick={fetchSummary}
                            >
                                Try Again
                            </button>
                            <button
                                className="secondary-button"
                                onClick={() => navigate('/getYourPages')}
                            >
                                Back to Pages
                            </button>
                        </div>
                    </div>
                )}
                {!loading && !error && summary && (
                    <div className="summary-content">
                        <div className="metrics-grid">
                            {summary.seoScore !== undefined && (
                                <div className="metric-card">
                                    <div className="metric-icon">🎯</div>
                                    <div className="metric-info">
                                        <span className="metric-value">{summary.seoScore}</span>
                                        <span className="metric-label">SEO Score</span>
                                    </div>
                                    <div className="metric-progress">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${summary.seoScore}%`, backgroundColor: summary.seoScore > 70 ? '#22c55e' : summary.seoScore > 40 ? '#f59e0b' : '#ef4444' }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            {summary.wordCount !== undefined && (
                                <div className="metric-card">
                                    <div className="metric-icon">📝</div>
                                    <div className="metric-info">
                                        <span className="metric-value">{summary.wordCount.toLocaleString()}</span>
                                        <span className="metric-label">Word Count</span>
                                    </div>
                                </div>
                            )}
                            {summary.readabilityScore !== undefined && (
                                <div className="metric-card">
                                    <div className="metric-icon">📖</div>
                                    <div className="metric-info">
                                        <span className="metric-value">{summary.readabilityScore}</span>
                                        <span className="metric-label">Readability</span>
                                    </div>
                                </div>
                            )}
                            {summary.sentiment && (
                                <div className="metric-card">
                                    <div className="metric-icon">😊</div>
                                    <div className="metric-info">
                                        <span className="metric-value" style={{ color: getSentimentColor(summary.sentiment) }}>
                                            {summary.sentiment}
                                        </span>
                                        <span className="metric-label">Sentiment</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="tab-navigation">
                            <button
                                className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                                onClick={() => setActiveTab('summary')}
                            >
                                <span className="tab-icon">📋</span>
                                Summary
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'keyPoints' ? 'active' : ''}`}
                                onClick={() => setActiveTab('keyPoints')}
                            >
                                <span className="tab-icon">🔑</span>
                                Key Points
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analysis')}
                            >
                                <span className="tab-icon">📊</span>
                                Analysis
                            </button>
                        </div>
                        <div className="tab-content">
                            {activeTab === 'summary' && summary && (
                                <div className="summary-tab">
                                    <h2>{summary.title || 'Page Summary'}</h2>
                                    <div className="summary-text">
                                        {summary.content?.split('\n').map((paragraph, idx) => (
                                            <p key={idx}>{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeTab === 'keyPoints' && summary?.keyPoints && (
                                <div className="keypoints-tab">
                                    <h2>Key Points</h2>
                                    <ul className="keypoints-list">
                                        {summary.keyPoints.map((point, idx) => (
                                            <li key={idx}>
                                                <span className="point-bullet">•</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {activeTab === 'analysis' && summary && (
                                <div className="analysis-tab">
                                    <h2>SEO Analysis</h2>

                                    <div className="analysis-section">
                                        <h3>Content Quality</h3>
                                        <div className="quality-meter">
                                            <div className="meter-label">
                                                <span>Length</span>
                                                <span>{summary.wordCount?.toLocaleString() || 0} words</span>
                                            </div>
                                            <div className="meter-bar">
                                                <div
                                                    className="meter-fill"
                                                    style={{
                                                        width: `${Math.min((summary.wordCount || 0) / 30, 100)}%`,
                                                        backgroundColor: '#3b82f6'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="quality-meter">
                                            <div className="meter-label">
                                                <span>Readability</span>
                                                <span>{summary.readabilityScore || 'N/A'}</span>
                                            </div>
                                            <div className="meter-bar">
                                                <div
                                                    className="meter-fill"
                                                    style={{
                                                        width: `${summary.readabilityScore || 0}%`,
                                                        backgroundColor: '#8b5cf6'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="analysis-section">
                                        <h3>SEO Score Breakdown</h3>
                                        <div className="score-breakdown">
                                            <div className="score-item">
                                                <span className="score-label">Meta Tags</span>
                                                <span className="score-value">85%</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Headings Structure</span>
                                                <span className="score-value">70%</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Keyword Usage</span>
                                                <span className="score-value">90%</span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Internal Links</span>
                                                <span className="score-value">60%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="analysis-section">
                                        <h3>Recommendations</h3>
                                        <ul className="recommendations-list">
                                            <li>Add more internal links to improve navigation</li>
                                            <li>Optimize meta descriptions for better CTR</li>
                                            <li>Consider adding more structured data</li>
                                            <li>Improve heading hierarchy (H1 → H2 → H3)</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="summary-footer">
                            <button
                                className="secondary-button"
                                onClick={() => navigate('/getYourPages')}
                            >
                                ← Back to Pages
                            </button>
                            <button
                                className="primary-button"
                                onClick={() => window.print()}
                            >
                                <span className="button-icon">🖨️</span>
                                Print Summary
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiSummary;