const {
  MetricsAdvisorKeyCredential,
  MetricsAdvisorClient,
  MetricsAdvisorAdministrationClient,
} = require("@azure/ai-metrics-advisor");

require("dotenv").config();

async function getDataFeeds() {
  return mockDataFeeds.data;
}

async function getDetectionConfigs(metricId) {
  return mockedConfigs[metricId];
}

async function getSeriesData(metricId) {
  return mockedSeriesData[metricId];
}

async function getIncidents(detectionId) {}

async function getRootCause(incientId) {}

// lower pri
async function provideFeedback() {}

const mockDataFeeds = {
  data: [
    {
      name: "Blob data feed",
      id: "id1",
      schema: {
        metrics: [
          { id: "m1", name: "Metric1", description: "Metric1 description" },
          { id: "m2", name: "Metric2", description: "Metric2 description" },
        ],
      },
    },
    {
      name: "Sql Server data feed",
      id: "id2",
      schema: {
        metrics: [
          { id: "sql1", name: "cost", description: "cost description" },
          { id: "sql2", name: "revenue", description: "Revenue description" },
        ],
      },
    },
    {
      name: "App Insights data feed",
      id: "id3",
      schema: {
        metrics: [
          { id: "ai1", name: "M3", description: "M3 description" },
          { id: "ai2", name: "M4", description: "M4 description" },
        ],
      },
    },
    {
      name: "MongoDB data feed",
      id: "id4",
      schema: {
        metrics: [
          { id: "mgd1", name: "M5", description: "M5 description" },
          { id: "mgd2", name: "M6", description: "M6 description" },
        ],
      },
    },
  ],
};

const mockedConfigs = {
  m1: [
    {
      name: "detection config 1",
      description: "dc 1",
      id: "id1",
    },
    {
      name: "detection config 2",
      description: "dc 2",
      id: "id2",
    },
    {
      name: "detection config 3",
      description: "dc 3",
      id: "id3",
    },
  ],
  sql1: [
    {
      name: "detection config 4",
      description: "dc 4",
      id: "id1",
    },
    {
      name: "detection config 5",
      description: "dc 5",
      id: "id2",
    },
    {
      name: "detection config 6",
      description: "dc 6",
      id: "id3",
    },
  ],
  sql2: [
    {
      name: "detection config 7",
      description: "dc 7",
      id: "id1",
    },
    {
      name: "detection config 8",
      description: "dc 8",
      id: "id2",
    },
    {
      name: "detection config 9",
      description: "dc 9",
      id: "id3",
    },
  ],
};

const mockedSeriesData = {
  id1: [
    {
      title: "us-east",
      values: {
        x: ["t1", "t2", "t3", "t4"],
        y: [50, 88, 72, 91],
        points: ["A", "", "Ⓐ", ""],
      },
      lowerBounds: {
        x: ["t1", "t2", "t3", "t4"],
        y: [20, 68, 52, 71],
      },
      style: {
        line: "white",
      },
      pointStyle: "red",
    },
  ],
  m1: [
    {
      title: "us-west",
      values: {
        x: ["t1", "t2", "t3", "t4"],
        y: [99, 44, 22, 55],
        points: ["", "", "", "A"],
      },
      lowerBounds: {
        x: ["t1", "t2", "t3", "t4"],
        y: [70, 28, 12, 31],
      },
      style: {
        line: "white",
      },
      pointStyle: "red",
    },
  ],
};

module.exports.getDataFeeds = getDataFeeds;
module.exports.getDetectionConfigs = getDetectionConfigs;
module.exports.getSeriesData = getSeriesData;
module.exports.getIncidents = getIncidents;
module.exports.getRootCause = getRootCause;
module.exports.provideFeedback = provideFeedback();
