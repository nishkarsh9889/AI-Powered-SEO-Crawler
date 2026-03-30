// PageDetail.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./PageDetail.css";

interface Keyword {
    keyword: string;
    frequency: number;
    inTitle: boolean;
    inH1: boolean;
    inMeta: boolean;
    firstPosition?: number;
}

interface Link {
    url: string;
    location: "Head" | "Body" | "Title" | "Footer";
    count: number;
}

interface PageLinks {
    internalLinks: Link[];
    externalLinks: Link[];
}

interface PerCheckSeoScore {
    seoCheck: string;
    score: number;
}

interface CoreWebVitals {
    lcp?: number;
    fcp?: number;
    cls?: number;
    tbt?: number;
    speedIndex?: number;
    tti?: number;
}

interface FieldData {
    lcpPercentile?: number;
    clsPercentile?: number;
    fidPercentile?: number;
    overallCategory?: string;
}

interface CategoryScores {
    performance?: number;
    seo?: number;
    accessibility?: number;
    bestPractices?: number;
}

interface Crawlability {
    robotsTxt?: boolean;
    documentTitle?: boolean;
    metaDescription?: boolean;
    canonical?: boolean;
    crawlableAnchors?: boolean;
}

interface Security {
    httpStatus?: number;
    https?: boolean;
}

interface Diagnostics {
    serverResponseTime?: number;
    domSize?: number;
    totalByteWeight?: number;
    renderBlockingResources?: any;
    unusedCss?: any;
    unusedJavascript?: any;
    networkRequests?: any;
    thirdPartySummary?: any;
}

interface PageMeta {
    finalUrl?: string;
    fetchTime?: string;
    strategy?: string;
}

interface TechnicalSeo {
    meta?: PageMeta;
    scores?: CategoryScores;
    coreWebVitals?: CoreWebVitals;
    fieldData?: FieldData;
    crawlability?: Crawlability;
    security?: Security;
    structuredData?: boolean;
    diagnostics?: Diagnostics;
}

interface ProcessingStage {
    status: "pending" | "inProgress" | "completed" | "failed";
    startedAt?: string;
    completedAt?: string;
    error?: string;
}

interface Processing {
    pageQueue?: ProcessingStage;
    infoQueue?: ProcessingStage;
    technicalQueue?: ProcessingStage;
    pageSeoQueue?: ProcessingStage;
    siteSeoQueue?: ProcessingStage;
    overallStatus?: "queued" | "processing" | "completed" | "failed";
    progress?: number;
}

interface DomainInfo {
    _id: string;
    domainUrl?: string;
}

interface PageDetailData {
    _id: string;
    domain: DomainInfo;
    domainPageUrl: string;
    domainPageHtmlHash: string;
    perCheckSeoScore: PerCheckSeoScore[];
    pageLinks: PageLinks;
    pageDepth?: number;
    seoScore?: number;
    technicalSeo?: TechnicalSeo;
    overallScore?: number;
    keywords: Keyword[];
    isActive: boolean;
    processing: Processing;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse {
    status: string;
    statusCode: number;
    message: string;
    data: PageDetailData;
    timestamp: string;
}
const PageDetail = () => {
    const { pageId } = useParams<{ pageId: string }>();
    const navigate = useNavigate();
    const [pageData, setPageData] = useState<PageDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [showAllKeywords, setShowAllKeywords] = useState(false);
    useEffect(() => {
        if (pageId) {
            fetchPageDetails();
        }
    }, [pageId]);

    const fetchPageDetails = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setError("No access token found. Please authenticate.");
                setLoading(false);
                return;
            }

            const response = await axiosInstance.post<ApiResponse>(
                "/domainPage/findOne",
                { _id: pageId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === "success" && response.data.data) {
                setPageData(response.data.data);
            } else {
                setError(response.data.message || "Failed to fetch page details");
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Session expired. Please authenticate again.");
            } else {
                setError(err.response?.data?.error || "Network error occurred");
            }
        } finally {
            setLoading(false);
        }
    };
    const enqueueAISummary = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("domainToken");
            if (!token) {
                setError("No access token found. Please authenticate.");
                setLoading(false);
                return;
            }

            await axiosInstance.post(
                "/domainPage/aiSummary",
                { domainPageId: pageId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Successfully enqueued → navigate to AI Summary page
            navigate(`/aiSummary/${pageId}`);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to enqueue AI summary");
        } finally {
            setLoading(false);
        }
    };
    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    const formatScore = (score?: number) => {
        if (score === undefined || score === null) return "N/A";
        return score.toString();
    };

    // const formatNumber = (num?: number) => {
    //     if (num === undefined || num === null) return "N/A";
    //     return num.toString();
    // };

    // const formatBytes = (bytes?: number) => {
    //     if (bytes === undefined || bytes === null) return "N/A";
    //     return bytes.toString();
    // };

    // const formatMs = (ms?: number) => {
    //     if (ms === undefined || ms === null) return "N/A";
    //     return ms.toString();
    // };

    const formatBoolean = (value?: boolean) => {
        if (value === undefined || value === null) return "N/A";
        return value.toString();
    };

    const getStatusBadgeClass = (status?: string) => {
        switch (status) {
            case "completed": return "status-badge success";
            case "inProgress": return "status-badge warning";
            case "failed": return "status-badge error";
            case "pending": return "status-badge info";
            default: return "status-badge";
        }
    };

    if (loading) {
        return (
            <div className="page-detail-container">
                <nav className="nav-bar">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-text">SEO Crawler</span>
                            <span className="logo-badge">Beta</span>
                        </div>
                        <button
                            className="nav-button"
                            onClick={() => navigate('/getYourPages')}
                        >
                            ← Back to Pages
                        </button>
                    </div>
                </nav>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading page details...</p>
                </div>
            </div>
        );
    }

    if (error || !pageData) {
        return (
            <div className="page-detail-container">
                <nav className="nav-bar">
                    <div className="nav-content">
                        <div className="nav-logo">
                            <span className="logo-text">SEO Crawler</span>
                            <span className="logo-badge">Beta</span>
                        </div>
                        <button
                            className="nav-button"
                            onClick={() => navigate('/getYourPages')}
                        >
                            ← Back to Pages
                        </button>
                    </div>
                </nav>
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Error Loading Page</h3>
                    <p>{error || "Page not found"}</p>
                    <button
                        className="retry-button"
                        onClick={() => navigate('/getYourPages')}
                    >
                        Go Back to Pages
                    </button>
                </div>
            </div>
        );
    }

    const displayedKeywords = showAllKeywords ? pageData.keywords : pageData.keywords.slice(0, 20);

    return (
        <div className="page-detail-container">
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
                            onClick={() => navigate('/getYourPages')}
                        >
                            ← Back to Pages
                        </button>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                {/* Header */}
                <div className="detail-header">
                    <div className="header-left">
                        <h1 className="page-title">Page Details</h1>
                        <p className="page-url-display">{pageData.domainPageUrl}</p>
                        {pageData.domain?.domainUrl && (
                            <p className="domain-info">Domain: {pageData.domain.domainUrl}</p>
                        )}
                    </div>
                    <div className="header-actions">
                        <button
                            className="ai-summary-button"
                            onClick={enqueueAISummary}
                            disabled={loading}
                        >
                            <span className="button-icon">🤖</span>
                            {loading ? "Processing..." : "Generate AI Summary"}
                        </button>
                    </div>
                </div>

                {/* Score Cards */}
                <div className="score-cards">
                    <div className="score-card">
                        <div className="score-icon">🎯</div>
                        <div className="score-info">
                            <span className="score-value">{formatScore(pageData.overallScore)}</span>
                            <span className="score-label">Overall Score</span>
                        </div>
                    </div>
                    <div className="score-card">
                        <div className="score-icon">🔍</div>
                        <div className="score-info">
                            <span className="score-value">{formatScore(pageData.seoScore)}</span>
                            <span className="score-label">SEO Score</span>
                        </div>
                    </div>
                    <div className="score-card">
                        <div className="score-icon">📊</div>
                        <div className="score-info">
                            <span className="score-value">{pageData.pageDepth?.toString() || 'N/A'}</span>
                            <span className="score-label">Page Depth</span>
                        </div>
                    </div>
                </div>

                {/* Per-Check SEO Scores Section */}
                {pageData.perCheckSeoScore && pageData.perCheckSeoScore.length > 0 && (
                    <div className="detail-section">
                        <h2>SEO Check Scores</h2>
                        <div className="scores-grid">
                            {pageData.perCheckSeoScore.map((check, index) => (
                                <div key={index} className="category-score">
                                    <span className="category-name">Check {index + 1} (ID: {check.seoCheck})</span>
                                    <span className="category-value">{check.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Technical SEO Section */}
                {pageData.technicalSeo && (
                    <div className="detail-section">
                        <h2>Technical SEO</h2>

                        {/* Page Meta */}
                        {pageData.technicalSeo.meta && (
                            <div className="page-meta">
                                <h3>Page Meta</h3>
                                <div className="metadata-grid">
                                    {pageData.technicalSeo.meta.finalUrl && (
                                        <div className="metadata-item">
                                            <span className="metadata-label">Final URL</span>
                                            <span className="metadata-value">{pageData.technicalSeo.meta.finalUrl}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.meta.fetchTime && (
                                        <div className="metadata-item">
                                            <span className="metadata-label">Fetch Time</span>
                                            <span className="metadata-value">{formatDate(pageData.technicalSeo.meta.fetchTime)}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.meta.strategy && (
                                        <div className="metadata-item">
                                            <span className="metadata-label">Strategy</span>
                                            <span className="metadata-value">{pageData.technicalSeo.meta.strategy}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Category Scores */}
                        {pageData.technicalSeo.scores && (
                            <div className="category-scores">
                                <h3>Category Scores</h3>
                                <div className="scores-grid">
                                    {pageData.technicalSeo.scores.performance !== undefined && (
                                        <div className="category-score">
                                            <span className="category-name">Performance</span>
                                            <span className="category-value">{pageData.technicalSeo.scores.performance}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.scores.seo !== undefined && (
                                        <div className="category-score">
                                            <span className="category-name">SEO</span>
                                            <span className="category-value">{pageData.technicalSeo.scores.seo}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.scores.accessibility !== undefined && (
                                        <div className="category-score">
                                            <span className="category-name">Accessibility</span>
                                            <span className="category-value">{pageData.technicalSeo.scores.accessibility}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.scores.bestPractices !== undefined && (
                                        <div className="category-score">
                                            <span className="category-name">Best Practices</span>
                                            <span className="category-value">{pageData.technicalSeo.scores.bestPractices}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Core Web Vitals */}
                        {pageData.technicalSeo.coreWebVitals && (
                            <div className="core-web-vitals">
                                <h3>Core Web Vitals</h3>
                                <div className="vitals-grid">
                                    {pageData.technicalSeo.coreWebVitals.lcp !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">LCP</span>
                                            <span className="vital-value">{pageData.technicalSeo.coreWebVitals.lcp}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.coreWebVitals.fcp !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">FCP</span>
                                            <span className="vital-value">{pageData.technicalSeo.coreWebVitals.fcp}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.coreWebVitals.cls !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">CLS</span>
                                            <span className="vital-value">{pageData.technicalSeo.coreWebVitals.cls}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.coreWebVitals.tbt !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">TBT</span>
                                            <span className="vital-value">{pageData.technicalSeo.coreWebVitals.tbt}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.coreWebVitals.speedIndex !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">Speed Index</span>
                                            <span className="vital-value">{pageData.technicalSeo.coreWebVitals.speedIndex}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.coreWebVitals.tti !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">TTI</span>
                                            <span className="vital-value">{pageData.technicalSeo.coreWebVitals.tti}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Field Data */}
                        {pageData.technicalSeo.fieldData && (
                            <div className="field-data">
                                <h3>Field Data</h3>
                                <div className="vitals-grid">
                                    {pageData.technicalSeo.fieldData.lcpPercentile !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">LCP Percentile</span>
                                            <span className="vital-value">{pageData.technicalSeo.fieldData.lcpPercentile}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.fieldData.clsPercentile !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">CLS Percentile</span>
                                            <span className="vital-value">{pageData.technicalSeo.fieldData.clsPercentile}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.fieldData.fidPercentile !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">FID Percentile</span>
                                            <span className="vital-value">{pageData.technicalSeo.fieldData.fidPercentile}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.fieldData.overallCategory && (
                                        <div className="vital-item">
                                            <span className="vital-name">Overall Category</span>
                                            <span className="vital-value">{pageData.technicalSeo.fieldData.overallCategory}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Crawlability */}
                        {pageData.technicalSeo.crawlability && (
                            <div className="crawlability">
                                <h3>Crawlability</h3>
                                <div className="checks-grid">
                                    {Object.entries(pageData.technicalSeo.crawlability).map(([key, value]) => (
                                        <div key={key} className="check-item">
                                            <span className="check-name">{key}</span>
                                            <span className="check-value">{formatBoolean(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Security */}
                        {pageData.technicalSeo.security && (
                            <div className="security">
                                <h3>Security</h3>
                                <div className="security-details">
                                    {pageData.technicalSeo.security.httpStatus && (
                                        <div className="security-item">
                                            <span className="security-name">httpStatus</span>
                                            <span className="security-value">{pageData.technicalSeo.security.httpStatus}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.security.https !== undefined && (
                                        <div className="security-item">
                                            <span className="security-name">https</span>
                                            <span className="security-value">{formatBoolean(pageData.technicalSeo.security.https)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Structured Data */}
                        {pageData.technicalSeo.structuredData !== undefined && (
                            <div className="structured-data">
                                <h3>Structured Data</h3>
                                <div className="check-item">
                                    <span className="check-name">structuredData</span>
                                    <span className="check-value">{formatBoolean(pageData.technicalSeo.structuredData)}</span>
                                </div>
                            </div>
                        )}

                        {/* Diagnostics */}
                        {pageData.technicalSeo.diagnostics && (
                            <div className="diagnostics">
                                <h3>Diagnostics</h3>
                                <div className="vitals-grid">
                                    {pageData.technicalSeo.diagnostics.serverResponseTime !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">serverResponseTime</span>
                                            <span className="vital-value">{pageData.technicalSeo.diagnostics.serverResponseTime}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.diagnostics.domSize !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">domSize</span>
                                            <span className="vital-value">{pageData.technicalSeo.diagnostics.domSize}</span>
                                        </div>
                                    )}
                                    {pageData.technicalSeo.diagnostics.totalByteWeight !== undefined && (
                                        <div className="vital-item">
                                            <span className="vital-name">totalByteWeight</span>
                                            <span className="vital-value">{pageData.technicalSeo.diagnostics.totalByteWeight}</span>
                                        </div>
                                    )}
                                </div>
                                {/* UnusedCss and UnusedJavascript intentionally omitted */}
                            </div>
                        )}
                    </div>
                )}

                {/* Keywords Section */}
                {pageData.keywords && pageData.keywords.length > 0 && (
                    <div className="detail-section">
                        <div className="keywords-header">
                            <h2>Keywords</h2>
                            {!showAllKeywords && pageData.keywords.length > 20 && (
                                <button
                                    className="show-all-button"
                                    onClick={() => setShowAllKeywords(true)}
                                >
                                    Show All ({pageData.keywords.length} keywords)
                                </button>
                            )}
                            {showAllKeywords && (
                                <button
                                    className="show-less-button"
                                    onClick={() => setShowAllKeywords(false)}
                                >
                                    Show Less
                                </button>
                            )}
                        </div>
                        <div className="keywords-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>keyword</th>
                                        <th>frequency</th>
                                        <th>inTitle</th>
                                        <th>inH1</th>
                                        <th>inMeta</th>
                                        <th>firstPosition</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedKeywords.map((keyword, index) => (
                                        <tr key={index}>
                                            <td>{keyword.keyword}</td>
                                            <td>{keyword.frequency}</td>
                                            <td>{formatBoolean(keyword.inTitle)}</td>
                                            <td>{formatBoolean(keyword.inH1)}</td>
                                            <td>{formatBoolean(keyword.inMeta)}</td>
                                            <td>{keyword.firstPosition?.toString() || 'null'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Links Section */}
                <div className="detail-section">
                    <h2>Links</h2>
                    <div className="links-stats">
                        <div className="link-stat">
                            <span className="link-stat-label">Internal Links Count</span>
                            <span className="link-stat-value">{pageData.pageLinks?.internalLinks?.length || 0}</span>
                        </div>
                        <div className="link-stat">
                            <span className="link-stat-label">External Links Count</span>
                            <span className="link-stat-value">{pageData.pageLinks?.externalLinks?.length || 0}</span>
                        </div>
                    </div>

                    {/* Internal Links */}
                    {pageData.pageLinks?.internalLinks && pageData.pageLinks.internalLinks.length > 0 && (
                        <div className="links-sample">
                            <h3>Internal Links</h3>
                            <div className="links-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>url</th>
                                            <th>location</th>
                                            <th>count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageData.pageLinks.internalLinks.map((link, index) => (
                                            <tr key={index}>
                                                <td>{link.url}</td>
                                                <td>{link.location}</td>
                                                <td>{link.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* External Links */}
                    {pageData.pageLinks?.externalLinks && pageData.pageLinks.externalLinks.length > 0 && (
                        <div className="links-sample">
                            <h3>External Links</h3>
                            <div className="links-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>url</th>
                                            <th>location</th>
                                            <th>count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageData.pageLinks.externalLinks.map((link, index) => (
                                            <tr key={index}>
                                                <td>{link.url}</td>
                                                <td>{link.location}</td>
                                                <td>{link.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Processing Status */}
                {pageData.processing && (
                    <div className="detail-section">
                        <h2>Processing Status</h2>
                        <div className="processing-status">
                            <div className="status-item">
                                <span className="status-label">overallStatus</span>
                                <span className={getStatusBadgeClass(pageData.processing.overallStatus)}>
                                    {pageData.processing.overallStatus}
                                </span>
                            </div>
                            {pageData.processing.progress !== undefined && (
                                <div className="status-item">
                                    <span className="status-label">progress</span>
                                    <span className="status-value">{pageData.processing.progress}</span>
                                </div>
                            )}

                            {/* Queue Statuses */}
                            <div className="queue-statuses">
                                <h3>Queue Statuses</h3>
                                <div className="status-grid">
                                    {pageData.processing.pageQueue && (
                                        <div className="status-item">
                                            <span className="status-label">pageQueue.status</span>
                                            <span className={getStatusBadgeClass(pageData.processing.pageQueue.status)}>
                                                {pageData.processing.pageQueue.status}
                                            </span>
                                        </div>
                                    )}
                                    {pageData.processing.infoQueue && (
                                        <div className="status-item">
                                            <span className="status-label">infoQueue.status</span>
                                            <span className={getStatusBadgeClass(pageData.processing.infoQueue.status)}>
                                                {pageData.processing.infoQueue.status}
                                            </span>
                                        </div>
                                    )}
                                    {pageData.processing.technicalQueue && (
                                        <div className="status-item">
                                            <span className="status-label">technicalQueue.status</span>
                                            <span className={getStatusBadgeClass(pageData.processing.technicalQueue.status)}>
                                                {pageData.processing.technicalQueue.status}
                                            </span>
                                        </div>
                                    )}
                                    {pageData.processing.pageSeoQueue && (
                                        <div className="status-item">
                                            <span className="status-label">pageSeoQueue.status</span>
                                            <span className={getStatusBadgeClass(pageData.processing.pageSeoQueue.status)}>
                                                {pageData.processing.pageSeoQueue.status}
                                            </span>
                                        </div>
                                    )}
                                    {pageData.processing.siteSeoQueue && (
                                        <div className="status-item">
                                            <span className="status-label">siteSeoQueue.status</span>
                                            <span className={getStatusBadgeClass(pageData.processing.siteSeoQueue.status)}>
                                                {pageData.processing.siteSeoQueue.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className="detail-section">
                    <h2>Metadata</h2>
                    <div className="metadata-grid">
                        <div className="metadata-item">
                            <span className="metadata-label">_id</span>
                            <span className="metadata-value">{pageData._id}</span>
                        </div>
                        <div className="metadata-item">
                            <span className="metadata-label">domain._id</span>
                            <span className="metadata-value">{pageData.domain?._id || 'N/A'}</span>
                        </div>
                        <div className="metadata-item">
                            <span className="metadata-label">domainPageHtmlHash</span>
                            <span className="metadata-value hash-value">{pageData.domainPageHtmlHash}</span>
                        </div>
                        <div className="metadata-item">
                            <span className="metadata-label">createdAt</span>
                            <span className="metadata-value">{pageData.createdAt}</span>
                        </div>
                        <div className="metadata-item">
                            <span className="metadata-label">updatedAt</span>
                            <span className="metadata-value">{pageData.updatedAt}</span>
                        </div>
                        <div className="metadata-item">
                            <span className="metadata-label">isActive</span>
                            <span className="metadata-value">{formatBoolean(pageData.isActive)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageDetail;