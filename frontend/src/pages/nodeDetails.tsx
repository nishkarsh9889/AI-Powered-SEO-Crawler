import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./nodeDetails.css";

interface ApiResponse {
    status: string;
    statusCode: number;
    message: string;
    data?: any;
    timestamp: string;
}

interface Analytics {
    averageSeoScore: number;
    averageTechnicalSeoScore: number;
    overallScore: number;
    totalPages: number;
    lastCalculatedAt?: string;
}

interface TechnicalSeoAnalytics {
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
    crawlability?: {
        robotsTxt?: boolean;
        documentTitle?: boolean;
        metaDescription?: boolean;
        canonical?: boolean;
        crawlableAnchors?: boolean;
    };
    security?: {
        httpStatus?: number;
        https?: boolean;
    };
    diagnostics?: Record<string, any>;
}

interface Keyword {
    keyword: string;
    frequency: number;
    inTitle?: boolean;
    inH1?: boolean;
    inMeta?: boolean;
    firstPosition?: number;
}

interface DomainNode {
    _id: string;
    domain: string | { _id: string; domainUrl?: string };
    type: "baseNode" | "customNode";
    nodePath: string;
    domainPages: string[];
    analytics: Analytics;
    technicalSeoAnalytics: TechnicalSeoAnalytics;
    keywords: Keyword[];
    aiSummary?: string;
    lastEvaluatedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

const NodeDetails = () => {
    const { nodeId } = useParams<{ nodeId: string }>();
    const navigate = useNavigate();
    const [nodeData, setNodeData] = useState<DomainNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [showTechnicalSeo, setShowTechnicalSeo] = useState(false);
    const [showKeywords, setShowKeywords] = useState(false);
    const [generatingInsights, setGeneratingInsights] = useState(false);
    const [generatingAISummary, setGeneratingAISummary] = useState(false);
    const [insightsMessage, setInsightsMessage] = useState<string>("");
    const [aiSummaryMessage, setAISummaryMessage] = useState<string>("");

    useEffect(() => {
        if (nodeId) {
            fetchNodeDetails();
        }
    }, [nodeId]);

    const fetchNodeDetails = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setError("No access token found. Please authenticate.");
                setLoading(false);
                return;
            }

            console.log("Fetching node details for ID:", nodeId);

            const response = await axiosInstance.post<ApiResponse>(
                "/domainNode/findOne",
                { _id: nodeId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }
            );

            console.log("API Response:", response.data);

            if (response.data.status === "success") {
                const nodeDetails = response.data.data || response.data;
                console.log("Node details extracted:", nodeDetails);

                if (nodeDetails && nodeDetails.nodePath) {
                    setNodeData(nodeDetails);
                } else {
                    setError("Invalid node data received from server");
                }
            } else {
                setError(response.data.message || "Failed to fetch node details");
            }
        } catch (err: any) {
            console.error("Error fetching node details:", err);

            if (err.code === 'ECONNABORTED') {
                setError("Request timeout. Please try again.");
            } else if (err.response?.status === 401) {
                setError("Session expired. Please authenticate again.");
            } else if (err.response?.status === 404) {
                setError("Node not found");
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Network error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGetInsights = async () => {
        if (!nodeId) return;

        setGeneratingInsights(true);
        setInsightsMessage("");

        try {
            const token = localStorage.getItem('domainToken');
            if (!token) {
                setInsightsMessage("Authentication failed. Please log in again.");
                setGeneratingInsights(false);
                return;
            }

            // FIRE AND FORGET: Trigger the API call, but do NOT await
            axiosInstance.post<ApiResponse>(
                "/domainNodeInsights/nodeInsights",
                { domainNodes: [nodeId] },
                { headers: { Authorization: `Bearer ${token}` }, timeout: 50000 } // long timeout is okay
            ).then(res => {
                console.log("Insights generation response:", res.data);
            }).catch(err => {
                console.error("Insights generation error:", err);
            });

            // Immediately navigate to the next page
            navigate(`/nodeInsights/${nodeId}`);

        } catch (err: any) {
            console.error("Error triggering insights:", err);
            setInsightsMessage(`❌ ${err.message || "Failed to trigger insights"}`);
            setGeneratingInsights(false);
        }
    };

    const handleGenerateAISummary = async () => {
        if (!nodeId) return;

        setGeneratingAISummary(true);
        setAISummaryMessage("");

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setAISummaryMessage("Authentication failed. Please log in again.");
                setGeneratingAISummary(false);
                return;
            }

            const response = await axiosInstance.post<ApiResponse>(
                "/domainNode/generateAISummary",
                { nodeId: nodeId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 30000 // Longer timeout for AI generation
                }
            );

            console.log("AI Summary response:", response.data);

            if (response.data.status === "success") {
                setAISummaryMessage("✅ AI Summary generated successfully!");

                // Refresh node details to show the new summary
                await fetchNodeDetails();

                // Clear message after 5 seconds
                setTimeout(() => setAISummaryMessage(""), 5000);
            } else {
                setAISummaryMessage(`❌ ${response.data.message || "Failed to generate AI summary"}`);
            }
        } catch (err: any) {
            console.error("Error generating AI summary:", err);

            if (err.response?.status === 401) {
                setAISummaryMessage("❌ Session expired. Please authenticate again.");
            } else if (err.response?.status === 404) {
                setAISummaryMessage("❌ Node not found");
            } else if (err.response?.data?.message) {
                setAISummaryMessage(`❌ ${err.response.data.message}`);
            } else {
                setAISummaryMessage("❌ Failed to generate AI summary. Please try again.");
            }
        } finally {
            setGeneratingAISummary(false);
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

    const getNodeTypeDisplayName = (type: "baseNode" | "customNode") => {
        switch (type) {
            case "baseNode": return "Base Node";
            case "customNode": return "Custom Node";
            default: return type;
        }
    };

    const getNodeTypeBadgeClass = (type: "baseNode" | "customNode") => {
        switch (type) {
            case "baseNode": return "node-badge base";
            case "customNode": return "node-badge custom";
            default: return "node-badge";
        }
    };

    const getDomainDisplay = () => {
        if (!nodeData?.domain) return null;

        if (typeof nodeData.domain === 'string') {
            return `Domain ID: ${nodeData.domain}`;
        } else if (nodeData.domain.domainUrl) {
            return `Domain: ${nodeData.domain.domainUrl}`;
        } else if (nodeData.domain._id) {
            return `Domain ID: ${nodeData.domain._id}`;
        }
        return null;
    };

    const getCoreWebVitalStatus = (value?: number, type: 'lcp' | 'cls' | 'fid' = 'lcp') => {
        if (!value) return { status: 'unknown', color: '#64748b' };

        if (type === 'lcp') {
            if (value <= 2500) return { status: 'good', color: '#10b981' };
            if (value <= 4000) return { status: 'needs-improvement', color: '#f59e0b' };
            return { status: 'poor', color: '#ef4444' };
        }
        if (type === 'cls') {
            if (value <= 0.1) return { status: 'good', color: '#10b981' };
            if (value <= 0.25) return { status: 'needs-improvement', color: '#f59e0b' };
            return { status: 'poor', color: '#ef4444' };
        }
        return { status: 'unknown', color: '#64748b' };
    };

    if (loading) {
        return (
            <div className="node-details-container">
                <nav className="nav-bar">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-text">SEO Crawler</span>
                            <span className="logo-badge">Beta</span>
                        </div>
                        <button
                            className="nav-button"
                            onClick={() => navigate('/createNode')}
                        >
                            ← Back to Nodes
                        </button>
                    </div>
                </nav>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading node details...</p>
                </div>
            </div>
        );
    }

    if (error || !nodeData) {
        return (
            <div className="node-details-container">
                <nav className="nav-bar">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-text">SEO Crawler</span>
                            <span className="logo-badge">Beta</span>
                        </div>
                        <button
                            className="nav-button"
                            onClick={() => navigate('/createNode')}
                        >
                            ← Back to Nodes
                        </button>
                    </div>
                </nav>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Error Loading Node</h3>
                    <p>{error || "Node not found"}</p>
                    <button
                        className="retry-button"
                        onClick={fetchNodeDetails}
                    >
                        Try Again
                    </button>
                    <button
                        className="retry-button secondary"
                        onClick={() => navigate('/createNode')}
                        style={{ marginLeft: '1rem' }}
                    >
                        Go Back to Nodes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="node-details-container">
            {/* Navigation */}
            <nav className="nav-bar">
                <div className="nav-content">
                    <div className="nav-logo">
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                    <div className="nav-actions">
                        <button
                            className="nav-button"
                            onClick={() => navigate('/createNode')}
                        >
                            ← Back to Nodes
                        </button>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                <div className="details-header">
                    <div className="header-left">
                        <div className="title-with-badge">
                            <h1 className="page-title">Node Details</h1>
                            <span className={getNodeTypeBadgeClass(nodeData.type)}>
                                {getNodeTypeDisplayName(nodeData.type)}
                            </span>
                        </div>
                        <p className="node-path-display">{nodeData.nodePath}</p>
                        {getDomainDisplay() && (
                            <p className="domain-info">{getDomainDisplay()}</p>
                        )}
                    </div>
                    <div className="header-right">
                        <button
                            className="insights-button"
                            onClick={handleGetInsights}
                            disabled={generatingInsights}
                        >
                            {generatingInsights ? (
                                <>
                                    <span className="button-spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                "Get Insights"
                            )}
                        </button>
                        <button
                            className="ai-summary-button"
                            onClick={handleGenerateAISummary}
                            disabled={generatingAISummary}
                        >
                            {generatingAISummary ? (
                                <>
                                    <span className="button-spinner"></span>
                                    Generating...
                                </>
                            ) : (
                                "Generate AI Summary"
                            )}
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
                {insightsMessage && (
                    <div className={`status-message ${insightsMessage.includes('✅') ? 'success' : 'error'}`}>
                        {insightsMessage}
                    </div>
                )}

                {aiSummaryMessage && (
                    <div className={`status-message ${aiSummaryMessage.includes('✅') ? 'success' : 'error'}`}>
                        {aiSummaryMessage}
                    </div>
                )}

                {/* Score Cards */}
                <div className="score-cards">
                    <div className="score-card" style={{ borderLeft: `4px solid ${getScoreColor(nodeData.analytics?.overallScore)}` }}>
                        <div className="score-icon">🎯</div>
                        <div className="score-info">
                            <span className="score-value">{formatScore(nodeData.analytics?.overallScore)}</span>
                            <span className="score-label">Overall Score</span>
                        </div>
                    </div>
                    <div className="score-card" style={{ borderLeft: `4px solid ${getScoreColor(nodeData.analytics?.averageSeoScore)}` }}>
                        <div className="score-icon">🔍</div>
                        <div className="score-info">
                            <span className="score-value">{formatScore(nodeData.analytics?.averageSeoScore)}</span>
                            <span className="score-label">Avg SEO Score</span>
                        </div>
                    </div>
                    <div className="score-card" style={{ borderLeft: `4px solid ${getScoreColor(nodeData.analytics?.averageTechnicalSeoScore)}` }}>
                        <div className="score-icon">⚙️</div>
                        <div className="score-info">
                            <span className="score-value">{formatScore(nodeData.analytics?.averageTechnicalSeoScore)}</span>
                            <span className="score-label">Avg Technical Score</span>
                        </div>
                    </div>
                    <div className="score-card">
                        <div className="score-icon">📄</div>
                        <div className="score-info">
                            <span className="score-value">{nodeData.analytics?.totalPages || 0}</span>
                            <span className="score-label">Total Pages</span>
                        </div>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="detail-section">
                    <h2>Analytics</h2>
                    <div className="analytics-grid">
                        <div className="analytics-item">
                            <span className="analytics-label">Average SEO Score</span>
                            <span className="analytics-value" style={{ color: getScoreColor(nodeData.analytics?.averageSeoScore) }}>
                                {formatScore(nodeData.analytics?.averageSeoScore)}
                            </span>
                        </div>
                        <div className="analytics-item">
                            <span className="analytics-label">Average Technical SEO Score</span>
                            <span className="analytics-value" style={{ color: getScoreColor(nodeData.analytics?.averageTechnicalSeoScore) }}>
                                {formatScore(nodeData.analytics?.averageTechnicalSeoScore)}
                            </span>
                        </div>
                        <div className="analytics-item">
                            <span className="analytics-label">Overall Score</span>
                            <span className="analytics-value" style={{ color: getScoreColor(nodeData.analytics?.overallScore) }}>
                                {formatScore(nodeData.analytics?.overallScore)}
                            </span>
                        </div>
                        <div className="analytics-item">
                            <span className="analytics-label">Total Pages in Node</span>
                            <span className="analytics-value">{nodeData.analytics?.totalPages || 0}</span>
                        </div>
                        <div className="analytics-item full-width">
                            <span className="analytics-label">Last Calculated</span>
                            <span className="analytics-value">{formatDate(nodeData.analytics?.lastCalculatedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Technical SEO Analytics Section */}
                {nodeData.technicalSeoAnalytics && (
                    <div className="detail-section">
                        <div className="section-header">
                            <h2>Technical SEO Analytics</h2>
                            <button
                                className="toggle-button"
                                onClick={() => setShowTechnicalSeo(!showTechnicalSeo)}
                            >
                                {showTechnicalSeo ? 'Hide Details' : 'Show Details'}
                            </button>
                        </div>

                        {showTechnicalSeo && (
                            <div className="technical-seo-content">
                                {/* Scores */}
                                {nodeData.technicalSeoAnalytics.scores && (
                                    <div className="technical-subsection">
                                        <h3>Scores</h3>
                                        <div className="scores-grid">
                                            <div className="score-item">
                                                <span className="score-label">Performance</span>
                                                <span className="score-badge" style={{ background: getScoreColor(nodeData.technicalSeoAnalytics.scores.performance) }}>
                                                    {formatScore(nodeData.technicalSeoAnalytics.scores.performance)}
                                                </span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">SEO</span>
                                                <span className="score-badge" style={{ background: getScoreColor(nodeData.technicalSeoAnalytics.scores.seo) }}>
                                                    {formatScore(nodeData.technicalSeoAnalytics.scores.seo)}
                                                </span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Accessibility</span>
                                                <span className="score-badge" style={{ background: getScoreColor(nodeData.technicalSeoAnalytics.scores.accessibility) }}>
                                                    {formatScore(nodeData.technicalSeoAnalytics.scores.accessibility)}
                                                </span>
                                            </div>
                                            <div className="score-item">
                                                <span className="score-label">Best Practices</span>
                                                <span className="score-badge" style={{ background: getScoreColor(nodeData.technicalSeoAnalytics.scores.bestPractices) }}>
                                                    {formatScore(nodeData.technicalSeoAnalytics.scores.bestPractices)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Core Web Vitals */}
                                {nodeData.technicalSeoAnalytics.coreWebVitals && (
                                    <div className="technical-subsection">
                                        <h3>Core Web Vitals</h3>
                                        <div className="web-vitals-grid">
                                            <div className="vital-item">
                                                <span className="vital-label">LCP</span>
                                                <span className="vital-value" style={{ color: getCoreWebVitalStatus(nodeData.technicalSeoAnalytics.coreWebVitals.lcp, 'lcp').color }}>
                                                    {formatNumber(nodeData.technicalSeoAnalytics.coreWebVitals.lcp)}ms
                                                </span>
                                            </div>
                                            <div className="vital-item">
                                                <span className="vital-label">FCP</span>
                                                <span className="vital-value">{formatNumber(nodeData.technicalSeoAnalytics.coreWebVitals.fcp)}ms</span>
                                            </div>
                                            <div className="vital-item">
                                                <span className="vital-label">CLS</span>
                                                <span className="vital-value" style={{ color: getCoreWebVitalStatus(nodeData.technicalSeoAnalytics.coreWebVitals.cls, 'cls').color }}>
                                                    {formatNumber(nodeData.technicalSeoAnalytics.coreWebVitals.cls)}
                                                </span>
                                            </div>
                                            <div className="vital-item">
                                                <span className="vital-label">TBT</span>
                                                <span className="vital-value">{formatNumber(nodeData.technicalSeoAnalytics.coreWebVitals.tbt)}ms</span>
                                            </div>
                                            <div className="vital-item">
                                                <span className="vital-label">Speed Index</span>
                                                <span className="vital-value">{formatNumber(nodeData.technicalSeoAnalytics.coreWebVitals.speedIndex)}ms</span>
                                            </div>
                                            <div className="vital-item">
                                                <span className="vital-label">TTI</span>
                                                <span className="vital-value">{formatNumber(nodeData.technicalSeoAnalytics.coreWebVitals.tti)}ms</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Field Data */}
                                {nodeData.technicalSeoAnalytics.fieldData && (
                                    <div className="technical-subsection">
                                        <h3>Field Data</h3>
                                        <div className="field-data-grid">
                                            <div className="field-item">
                                                <span className="field-label">LCP Percentile</span>
                                                <span className="field-value">{formatNumber(nodeData.technicalSeoAnalytics.fieldData.lcpPercentile)}</span>
                                            </div>
                                            <div className="field-item">
                                                <span className="field-label">CLS Percentile</span>
                                                <span className="field-value">{formatNumber(nodeData.technicalSeoAnalytics.fieldData.clsPercentile)}</span>
                                            </div>
                                            <div className="field-item">
                                                <span className="field-label">FID Percentile</span>
                                                <span className="field-value">{formatNumber(nodeData.technicalSeoAnalytics.fieldData.fidPercentile)}</span>
                                            </div>
                                            {nodeData.technicalSeoAnalytics.fieldData.overallCategory && (
                                                <div className="field-item full-width">
                                                    <span className="field-label">Overall Category</span>
                                                    <span className={`category-badge ${nodeData.technicalSeoAnalytics.fieldData.overallCategory.toLowerCase()}`}>
                                                        {nodeData.technicalSeoAnalytics.fieldData.overallCategory}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Crawlability */}
                                {nodeData.technicalSeoAnalytics.crawlability && (
                                    <div className="technical-subsection">
                                        <h3>Crawlability</h3>
                                        <div className="crawlability-grid">
                                            {Object.entries(nodeData.technicalSeoAnalytics.crawlability).map(([key, value]) => (
                                                <div key={key} className="crawlability-item">
                                                    <span className="crawlability-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className={`status-badge ${value ? 'success' : 'error'}`}>
                                                        {value ? '✓' : '✗'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Security */}
                                {nodeData.technicalSeoAnalytics.security && (
                                    <div className="technical-subsection">
                                        <h3>Security</h3>
                                        <div className="security-grid">
                                            <div className="security-item">
                                                <span className="security-label">HTTP Status</span>
                                                <span className={`status-code ${nodeData.technicalSeoAnalytics.security.httpStatus === 200 ? 'success' : 'warning'}`}>
                                                    {nodeData.technicalSeoAnalytics.security.httpStatus}
                                                </span>
                                            </div>
                                            <div className="security-item">
                                                <span className="security-label">HTTPS</span>
                                                <span className={`status-badge ${nodeData.technicalSeoAnalytics.security.https ? 'success' : 'error'}`}>
                                                    {nodeData.technicalSeoAnalytics.security.https ? '✓' : '✗'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {nodeData.keywords && nodeData.keywords.length > 0 && (
                    <div className="detail-section">
                        <div className="section-header">
                            <h2>Keywords</h2>
                            <button
                                className="toggle-button"
                                onClick={() => setShowKeywords(!showKeywords)}
                            >
                                {showKeywords ? 'Hide Keywords' : `Show Keywords (${nodeData.keywords.length})`}
                            </button>
                        </div>

                        {showKeywords && (
                            <div className="keywords-list">
                                <table className="keywords-table">
                                    <thead>
                                        <tr>
                                            <th>Keyword</th>
                                            <th>Frequency</th>
                                            <th>In Title</th>
                                            <th>In H1</th>
                                            <th>In Meta</th>
                                            <th>First Position</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nodeData.keywords.map((kw, index) => (
                                            <tr key={index}>
                                                <td className="keyword-cell">{kw.keyword}</td>
                                                <td>{kw.frequency}</td>
                                                <td>{kw.inTitle ? '✓' : '✗'}</td>
                                                <td>{kw.inH1 ? '✓' : '✗'}</td>
                                                <td>{kw.inMeta ? '✓' : '✗'}</td>
                                                <td>{kw.firstPosition || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Domain Pages Section */}
                {nodeData.domainPages && nodeData.domainPages.length > 0 && (
                    <div className="detail-section">
                        <div className="section-header">
                            <h2>Domain Pages</h2>
                            <span className="pages-count">{nodeData.domainPages.length} pages</span>
                        </div>
                        <div className="pages-list">
                            {nodeData.domainPages.map((pageId, index) => (
                                <div key={index} className="page-item">
                                    <span className="page-icon">📄</span>
                                    <span className="page-id">{pageId}</span>
                                    <button
                                        className="view-page-button"
                                        onClick={() => navigate(`/pageDetail/${pageId}`)}
                                    >
                                        View Page →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline Section */}
                <div className="detail-section">
                    <h2>Timeline</h2>
                    <div className="timeline-grid">
                        {nodeData.lastEvaluatedAt && (
                            <div className="timeline-item">
                                <span className="timeline-label">Last Evaluated</span>
                                <span className="timeline-value">{formatDate(nodeData.lastEvaluatedAt)}</span>
                            </div>
                        )}
                        {nodeData.createdAt && (
                            <div className="timeline-item">
                                <span className="timeline-label">Created</span>
                                <span className="timeline-value">{formatDate(nodeData.createdAt)}</span>
                            </div>
                        )}
                        {nodeData.updatedAt && (
                            <div className="timeline-item">
                                <span className="timeline-label">Last Updated</span>
                                <span className="timeline-value">{formatDate(nodeData.updatedAt)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeDetails;