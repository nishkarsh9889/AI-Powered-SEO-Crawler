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
  key: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  status: "passed" | "failed";
  passed: boolean;
  score: number;
  scoringType: string;
  maxScore: number;
  thresholds: Record<string, any>;
  recommendedAction: string;
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
  id?: string;
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
  const [selectedSeoCategory, setSelectedSeoCategory] = useState<string>("all");
  const [selectedSeoCheck, setSelectedSeoCheck] =
    useState<PerCheckSeoScore | null>(null);

  useEffect(() => {
    if (pageId) {
      fetchPageDetails();
    }
  }, [pageId]);

  const fetchPageDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("domainToken");

      if (!token) {
        setError("No access token found. Please authenticate.");
        setLoading(false);
        return;
      }

      // Updated API endpoint
      const response = await axiosInstance.post<ApiResponse>(
        "/domainPage/getPageDetails",
        { _id: pageId },
        { headers: { Authorization: `Bearer ${token}` } },
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
        { headers: { Authorization: `Bearer ${token}` } },
      );
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
    return Math.round(score).toString();
  };

  const formatBoolean = (value?: boolean) => {
    if (value === undefined || value === null) return "N/A";
    return value ? "Yes" : "No";
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "completed":
        return "status-badge success";
      case "inProgress":
        return "status-badge warning";
      case "failed":
        return "status-badge error";
      case "pending":
        return "status-badge info";
      default:
        return "status-badge";
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "priority-badge critical";
      case "high":
        return "priority-badge high";
      case "medium":
        return "priority-badge medium";
      case "low":
        return "priority-badge low";
      default:
        return "priority-badge";
    }
  };

  // Get unique categories from SEO checks
  const getUniqueCategories = () => {
    if (!pageData?.perCheckSeoScore) return [];
    const categories = new Set<string>();
    pageData.perCheckSeoScore.forEach((check) => {
      if (check.category) {
        categories.add(check.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Filter SEO checks by selected category
  const getFilteredSeoChecks = () => {
    if (!pageData?.perCheckSeoScore) return [];
    if (selectedSeoCategory === "all") {
      return pageData.perCheckSeoScore;
    }
    return pageData.perCheckSeoScore.filter(
      (check) => check.category === selectedSeoCategory,
    );
  };

  // Get category counts
  const getCategoryCount = (category: string) => {
    if (!pageData?.perCheckSeoScore) return 0;
    if (category === "all") return pageData.perCheckSeoScore.length;
    return pageData.perCheckSeoScore.filter((c) => c.category === category)
      .length;
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get status icon and text without showing scores
  const getStatusDisplay = (check: PerCheckSeoScore) => {
    if (check.status === "passed") {
      return { icon: "✅", text: "Passed", class: "passed" };
    } else {
      return { icon: "❌", text: "Failed", class: "failed" };
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
              onClick={() => navigate("/getYourPages")}
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
              onClick={() => navigate("/getYourPages")}
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
            onClick={() => navigate("/getYourPages")}
          >
            Go Back to Pages
          </button>
        </div>
      </div>
    );
  }

  const displayedKeywords = showAllKeywords
    ? pageData.keywords
    : pageData.keywords.slice(0, 20);
  const filteredSeoChecks = getFilteredSeoChecks();
  const categories = getUniqueCategories();

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
              onClick={() => navigate("/getYourPages")}
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
              <span className="score-value">
                {formatScore(pageData.overallScore)}
              </span>
              <span className="score-label">Overall Score</span>
            </div>
          </div>
          <div className="score-card">
            <div className="score-icon">🔍</div>
            <div className="score-info">
              <span className="score-value">
                {formatScore(pageData.seoScore)}
              </span>
              <span className="score-label">SEO Score</span>
            </div>
          </div>
          <div className="score-card">
            <div className="score-icon">📊</div>
            <div className="score-info">
              <span className="score-value">
                {pageData.pageDepth !== undefined && pageData.pageDepth !== null
                  ? pageData.pageDepth.toString()
                  : "0"}
              </span>
              <span className="score-label">Page Depth</span>
            </div>
          </div>
        </div>

        {/* Per-Check SEO Scores Section without showing numeric scores */}
        {pageData.perCheckSeoScore && pageData.perCheckSeoScore.length > 0 && (
          <div className="detail-section">
            <div className="seo-checks-header">
              <h2>SEO Check Results</h2>
              <div className="category-dropdown">
                <label htmlFor="seoCategory">Filter by Category: </label>
                <select
                  id="seoCategory"
                  value={selectedSeoCategory}
                  onChange={(e) => setSelectedSeoCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="all">
                    All Categories ({getCategoryCount("all")})
                  </option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {formatCategoryName(category)} (
                      {getCategoryCount(category)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SEO Checks List - No scores shown */}
            <div className="seo-checks-list">
              {filteredSeoChecks.map((check, index) => {
                const statusDisplay = getStatusDisplay(check);
                return (
                  <div
                    key={index}
                    className={`seo-check-item ${check.status}`}
                    onClick={() => setSelectedSeoCheck(check)}
                  >
                    <div className="seo-check-item-header">
                      <div className="seo-check-item-title">
                        <span className={`status-icon ${statusDisplay.class}`}>
                          {statusDisplay.icon}
                        </span>
                        <span className="seo-check-item-name">
                          {check.name}
                        </span>
                        <span className={getPriorityBadgeClass(check.priority)}>
                          {check.priority}
                        </span>
                      </div>
                      <div
                        className={`seo-check-item-status ${statusDisplay.class}`}
                      >
                        {statusDisplay.text}
                      </div>
                    </div>
                    <div className="seo-check-item-description">
                      {check.description}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal for detailed SEO check info - No scores shown */}
            {selectedSeoCheck && (
              <div
                className="modal-overlay"
                onClick={() => setSelectedSeoCheck(null)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <h3>{selectedSeoCheck.name}</h3>
                    <button
                      className="modal-close"
                      onClick={() => setSelectedSeoCheck(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="modal-section">
                      <label>Status</label>
                      <div
                        className={`modal-status ${selectedSeoCheck.status}`}
                      >
                        {selectedSeoCheck.status === "passed"
                          ? "✅ Passed"
                          : "❌ Failed"}
                      </div>
                    </div>
                    <div className="modal-section">
                      <label>Category</label>
                      <div>{formatCategoryName(selectedSeoCheck.category)}</div>
                    </div>
                    <div className="modal-section">
                      <label>Priority</label>
                      <div
                        className={getPriorityBadgeClass(
                          selectedSeoCheck.priority,
                        )}
                      >
                        {selectedSeoCheck.priority}
                      </div>
                    </div>
                    <div className="modal-section">
                      <label>Description</label>
                      <div className="modal-description">
                        {selectedSeoCheck.description}
                      </div>
                    </div>
                    <div className="modal-section">
                      <label>Recommended Action</label>
                      <div className="modal-recommendation">
                        {selectedSeoCheck.recommendedAction}
                      </div>
                    </div>
                    {selectedSeoCheck.thresholds &&
                      Object.keys(selectedSeoCheck.thresholds).length > 0 && (
                        <div className="modal-section">
                          <label>Requirements</label>
                          <div className="modal-thresholds">
                            {Object.entries(selectedSeoCheck.thresholds).map(
                              ([key, value]) => (
                                <div key={key} className="threshold-item">
                                  <span className="threshold-key">
                                    {key === "min"
                                      ? "Minimum Required"
                                      : key === "max"
                                        ? "Maximum Allowed"
                                        : key}
                                    :
                                  </span>
                                  <span className="threshold-value">
                                    {value}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    <div className="modal-section">
                      <label>Check Type</label>
                      <div>
                        {selectedSeoCheck.scoringType === "binary"
                          ? "Binary Check"
                          : "Range Check"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                      <span className="metadata-value">
                        {pageData.technicalSeo.meta.finalUrl}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.meta.fetchTime && (
                    <div className="metadata-item">
                      <span className="metadata-label">Fetch Time</span>
                      <span className="metadata-value">
                        {formatDate(pageData.technicalSeo.meta.fetchTime)}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.meta.strategy && (
                    <div className="metadata-item">
                      <span className="metadata-label">Strategy</span>
                      <span className="metadata-value">
                        {pageData.technicalSeo.meta.strategy}
                      </span>
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
                      <span className="category-value">
                        {pageData.technicalSeo.scores.performance}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.scores.seo !== undefined && (
                    <div className="category-score">
                      <span className="category-name">SEO</span>
                      <span className="category-value">
                        {pageData.technicalSeo.scores.seo}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.scores.accessibility !== undefined && (
                    <div className="category-score">
                      <span className="category-name">Accessibility</span>
                      <span className="category-value">
                        {pageData.technicalSeo.scores.accessibility}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.scores.bestPractices !== undefined && (
                    <div className="category-score">
                      <span className="category-name">Best Practices</span>
                      <span className="category-value">
                        {pageData.technicalSeo.scores.bestPractices}
                      </span>
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
                      <span className="vital-value">
                        {pageData.technicalSeo.coreWebVitals.lcp}ms
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.coreWebVitals.fcp !== undefined && (
                    <div className="vital-item">
                      <span className="vital-name">FCP</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.coreWebVitals.fcp}ms
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.coreWebVitals.cls !== undefined && (
                    <div className="vital-item">
                      <span className="vital-name">CLS</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.coreWebVitals.cls}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.coreWebVitals.tbt !== undefined && (
                    <div className="vital-item">
                      <span className="vital-name">TBT</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.coreWebVitals.tbt}ms
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.coreWebVitals.speedIndex !==
                    undefined && (
                    <div className="vital-item">
                      <span className="vital-name">Speed Index</span>
                      <span className="vital-value">
                        {Math.round(
                          pageData.technicalSeo.coreWebVitals.speedIndex,
                        )}
                        ms
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.coreWebVitals.tti !== undefined && (
                    <div className="vital-item">
                      <span className="vital-name">TTI</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.coreWebVitals.tti}ms
                      </span>
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
                  {pageData.technicalSeo.fieldData.lcpPercentile !==
                    undefined && (
                    <div className="vital-item">
                      <span className="vital-name">LCP Percentile</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.fieldData.lcpPercentile}ms
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.fieldData.clsPercentile !==
                    undefined && (
                    <div className="vital-item">
                      <span className="vital-name">CLS Percentile</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.fieldData.clsPercentile}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.fieldData.fidPercentile !==
                    undefined && (
                    <div className="vital-item">
                      <span className="vital-name">FID Percentile</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.fieldData.fidPercentile}ms
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.fieldData.overallCategory && (
                    <div className="vital-item">
                      <span className="vital-name">Overall Category</span>
                      <span
                        className={`vital-value ${pageData.technicalSeo.fieldData.overallCategory === "FAST" ? "success" : ""}`}
                      >
                        {pageData.technicalSeo.fieldData.overallCategory}
                      </span>
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
                  <div className="check-item">
                    <span className="check-name">Robots.txt</span>
                    <span className="check-value">
                      {formatBoolean(
                        pageData.technicalSeo.crawlability.robotsTxt,
                      )}
                    </span>
                  </div>
                  <div className="check-item">
                    <span className="check-name">Document Title</span>
                    <span className="check-value">
                      {formatBoolean(
                        pageData.technicalSeo.crawlability.documentTitle,
                      )}
                    </span>
                  </div>
                  <div className="check-item">
                    <span className="check-name">Meta Description</span>
                    <span className="check-value">
                      {formatBoolean(
                        pageData.technicalSeo.crawlability.metaDescription,
                      )}
                    </span>
                  </div>
                  <div className="check-item">
                    <span className="check-name">Canonical Tag</span>
                    <span className="check-value">
                      {formatBoolean(
                        pageData.technicalSeo.crawlability.canonical,
                      )}
                    </span>
                  </div>
                  <div className="check-item">
                    <span className="check-name">Crawlable Anchors</span>
                    <span className="check-value">
                      {formatBoolean(
                        pageData.technicalSeo.crawlability.crawlableAnchors,
                      )}
                    </span>
                  </div>
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
                      <span className="security-name">HTTP Status</span>
                      <span className="security-value">
                        {pageData.technicalSeo.security.httpStatus}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.security.https !== undefined && (
                    <div className="security-item">
                      <span className="security-name">HTTPS</span>
                      <span className="security-value">
                        {formatBoolean(pageData.technicalSeo.security.https)}
                      </span>
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
                  <span className="check-name">Structured Data Present</span>
                  <span className="check-value">
                    {formatBoolean(pageData.technicalSeo.structuredData)}
                  </span>
                </div>
              </div>
            )}

            {/* Diagnostics */}
            {pageData.technicalSeo.diagnostics && (
              <div className="diagnostics">
                <h3>Diagnostics</h3>
                <div className="vitals-grid">
                  {pageData.technicalSeo.diagnostics.serverResponseTime !==
                    undefined && (
                    <div className="vital-item">
                      <span className="vital-name">Server Response Time</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.diagnostics.serverResponseTime}ms
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.diagnostics.domSize !== undefined && (
                    <div className="vital-item">
                      <span className="vital-name">DOM Size</span>
                      <span className="vital-value">
                        {pageData.technicalSeo.diagnostics.domSize}
                      </span>
                    </div>
                  )}
                  {pageData.technicalSeo.diagnostics.totalByteWeight !==
                    undefined && (
                    <div className="vital-item">
                      <span className="vital-name">Total Byte Weight</span>
                      <span className="vital-value">
                        {(
                          pageData.technicalSeo.diagnostics.totalByteWeight /
                          1024
                        ).toFixed(2)}{" "}
                        KB
                      </span>
                    </div>
                  )}
                </div>
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
                    <th>Keyword</th>
                    <th>Frequency</th>
                    <th>In Title</th>
                    <th>In H1</th>
                    <th>In Meta</th>
                    <th>First Position</th>
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
                      <td>
                        {keyword.firstPosition !== undefined &&
                        keyword.firstPosition !== null
                          ? keyword.firstPosition
                          : "N/A"}
                      </td>
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
              <span className="link-stat-value">
                {pageData.pageLinks?.internalLinks?.length || 0}
              </span>
            </div>
            <div className="link-stat">
              <span className="link-stat-label">External Links Count</span>
              <span className="link-stat-value">
                {pageData.pageLinks?.externalLinks?.length || 0}
              </span>
            </div>
          </div>
          {pageData.pageLinks?.internalLinks &&
            pageData.pageLinks.internalLinks.length > 0 && (
              <div className="links-sample">
                <h3>Internal Links</h3>
                <div className="links-table">
                  <table>
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Location</th>
                        <th>Count</th>
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
          {pageData.pageLinks?.externalLinks &&
            pageData.pageLinks.externalLinks.length > 0 && (
              <div className="links-sample">
                <h3>External Links</h3>
                <div className="links-table">
                  <table>
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Location</th>
                        <th>Count</th>
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
                <span className="status-label">Overall Status</span>
                <span
                  className={getStatusBadgeClass(
                    pageData.processing.overallStatus,
                  )}
                >
                  {pageData.processing.overallStatus}
                </span>
              </div>
              {pageData.processing.progress !== undefined && (
                <div className="status-item">
                  <span className="status-label">Progress</span>
                  <span className="status-value">
                    {pageData.processing.progress}%
                  </span>
                </div>
              )}

              {/* Queue Statuses */}
              <div className="queue-statuses">
                <h3>Queue Statuses</h3>
                <div className="status-grid">
                  {pageData.processing.pageQueue && (
                    <div className="status-item">
                      <span className="status-label">Page Queue</span>
                      <span
                        className={getStatusBadgeClass(
                          pageData.processing.pageQueue.status,
                        )}
                      >
                        {pageData.processing.pageQueue.status}
                      </span>
                    </div>
                  )}
                  {pageData.processing.infoQueue && (
                    <div className="status-item">
                      <span className="status-label">Info Queue</span>
                      <span
                        className={getStatusBadgeClass(
                          pageData.processing.infoQueue.status,
                        )}
                      >
                        {pageData.processing.infoQueue.status}
                      </span>
                    </div>
                  )}
                  {pageData.processing.technicalQueue && (
                    <div className="status-item">
                      <span className="status-label">Technical Queue</span>
                      <span
                        className={getStatusBadgeClass(
                          pageData.processing.technicalQueue.status,
                        )}
                      >
                        {pageData.processing.technicalQueue.status}
                      </span>
                    </div>
                  )}
                  {pageData.processing.pageSeoQueue && (
                    <div className="status-item">
                      <span className="status-label">Page SEO Queue</span>
                      <span
                        className={getStatusBadgeClass(
                          pageData.processing.pageSeoQueue.status,
                        )}
                      >
                        {pageData.processing.pageSeoQueue.status}
                      </span>
                    </div>
                  )}
                  {pageData.processing.siteSeoQueue && (
                    <div className="status-item">
                      <span className="status-label">Site SEO Queue</span>
                      <span
                        className={getStatusBadgeClass(
                          pageData.processing.siteSeoQueue.status,
                        )}
                      >
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
              <span className="metadata-label">Page ID</span>
              <span className="metadata-value">
                {pageData.id || pageData._id}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Domain ID</span>
              <span className="metadata-value">
                {pageData.domain?._id || "N/A"}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Page Hash</span>
              <span className="metadata-value hash-value">
                {pageData.domainPageHtmlHash}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Created At</span>
              <span className="metadata-value">
                {formatDate(pageData.createdAt)}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Updated At</span>
              <span className="metadata-value">
                {formatDate(pageData.updatedAt)}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Active</span>
              <span className="metadata-value">
                {formatBoolean(pageData.isActive)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageDetail;
