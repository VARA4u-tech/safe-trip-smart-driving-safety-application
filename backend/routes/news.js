// routes/news.js
// 📰 News API Route - powered by NewsAPI.org

const express = require("express");
const axios = require("axios");
const router = express.Router();

const NEWS_API_KEY = process.env.NEWS_API_KEY;

/**
 * GET /api/news
 * Returns latest road safety and driving news relevant to India
 */
router.get("/", async (req, res) => {
  const { country = "in", category = "road safety" } = req.query;

  // No API key - return mock data
  if (!NEWS_API_KEY || NEWS_API_KEY.includes("YOUR_")) {
    console.log("⚠️ News API: Using mock data (no API key configured)");
    return res.json({ articles: getMockNews(), isMock: true });
  }

  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: "road accident driving safety traffic India",
        language: "en",
        sortBy: "publishedAt",
        pageSize: 10,
        apiKey: NEWS_API_KEY,
      },
      timeout: 5000,
    });

    const articles = (response.data.articles || [])
      .filter((a) => a.title && !a.title.includes("[Removed]"))
      .map((article) => ({
        id: article.url,
        title: article.title,
        description: article.description,
        source: article.source?.name || "Unknown",
        url: article.url,
        publishedAt: article.publishedAt,
        imageUrl: article.urlToImage,
        // Classify alert severity based on keywords
        severity: classifyNewsSeverity(
          article.title + " " + (article.description || ""),
        ),
      }));

    console.log(`📰 Fetched ${articles.length} news articles`);
    res.json({ articles, count: articles.length });
  } catch (error) {
    console.error("News API Error:", error.message);
    res.json({ articles: getMockNews(), isMock: true });
  }
});

/**
 * GET /api/news/alerts
 * Returns ONLY high-severity news that should be shown as driving alerts
 */
router.get("/alerts", async (req, res) => {
  if (!NEWS_API_KEY || NEWS_API_KEY.includes("YOUR_")) {
    const mockAlerts = getMockNews().filter((n) => n.severity === "high");
    return res.json({ alerts: mockAlerts, isMock: true });
  }

  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: "road accident closed highway India",
        language: "en",
        sortBy: "publishedAt",
        pageSize: 5,
        apiKey: NEWS_API_KEY,
      },
      timeout: 5000,
    });

    const alerts = (response.data.articles || [])
      .filter((a) => a.title && !a.title.includes("[Removed]"))
      .map((article) => ({
        id: article.url,
        title: article.title,
        description: article.description?.substring(0, 150) + "...",
        source: article.source?.name,
        publishedAt: article.publishedAt,
        severity: classifyNewsSeverity(article.title),
      }))
      .filter((a) => a.severity === "high");

    res.json({ alerts, count: alerts.length });
  } catch (error) {
    console.error("News Alerts Error:", error.message);
    res.json({ alerts: [], isMock: true });
  }
});

/**
 * Classify severity based on article content keywords
 */
function classifyNewsSeverity(text) {
  const lower = text.toLowerCase();
  const highKeywords = [
    "fatal",
    "death",
    "killed",
    "multiple casualties",
    "road closed",
    "highway blocked",
    "major accident",
  ];
  const mediumKeywords = [
    "accident",
    "crash",
    "collision",
    "injured",
    "traffic jam",
    "road block",
  ];

  if (highKeywords.some((kw) => lower.includes(kw))) return "high";
  if (mediumKeywords.some((kw) => lower.includes(kw))) return "medium";
  return "low";
}

function getMockNews() {
  return [
    {
      id: "mock_news_1",
      title: "NH44 Partially Closed Due to Road Widening Work",
      description:
        "National Highway 44 is partially closed near Siddipet for ongoing road widening. Commuters advised to use alternate routes.",
      source: "Times of India",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      severity: "high",
      url: "#",
    },
    {
      id: "mock_news_2",
      title: "Heavy Rains Expected Across Telangana - Drive Carefully",
      description:
        "IMD has issued a yellow alert for heavy rains. Drivers are advised to reduce speed and keep headlights on.",
      source: "NDTV",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      severity: "medium",
      url: "#",
    },
    {
      id: "mock_news_3",
      title: "Traffic Diversion on Outer Ring Road This Weekend",
      description:
        "GHMC has announced traffic diversions on ORR for maintenance work from Saturday evening to Sunday morning.",
      source: "Deccan Chronicle",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      severity: "medium",
      url: "#",
    },
    {
      id: "mock_news_4",
      title: "New Drunk Driving Crackdown Begins in Hyderabad",
      description:
        "Hyderabad Traffic Police have started special naka checking from midnight to 4 AM at major city entry points.",
      source: "The Hindu",
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      severity: "low",
      url: "#",
    },
  ];
}

module.exports = router;
