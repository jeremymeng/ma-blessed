const {
  MetricsAdvisorKeyCredential,
  MetricsAdvisorClient,
  MetricsAdvisorAdministrationClient,
} = require("@azure/ai-metrics-advisor");

require("dotenv").config();

const endpoint = process.env["METRICS_ADVISOR_ENDPOINT"];
const subscriptionKey = process.env["METRICS_ADVISOR_SUBSCRIPTION_KEY"];
const apiKey = process.env["METRICS_ADVISOR_API_KEY"];
const credential = new MetricsAdvisorKeyCredential(subscriptionKey, apiKey);
// const detectionConfigId = process.env["METRICS_ADVISOR_AZURE_BlOB_DETECTION_CONFIG_ID"];
// const metricId = "342346a5-4e6d-4cb7-9a0a-41901bdedb52"; // process.env["METRICS_ADVISOR_AZURE_Blob_METRIC_ID_1"];
//const incidentId = process.env["METRICS_ADVISOR_AZURE_BLOB_INCIDENT_ID"];

const client = new MetricsAdvisorClient(endpoint, credential);
const adminClient = new MetricsAdvisorAdministrationClient(
  endpoint,
  credential
);

let cache = {
  dataFeeds: undefined,
  detectionConfigs: {},
  enrichedSeries: {},
  incidents: {},
  anomalies: {},
  rootCauses: {},
};

async function getDataFeeds() {
  if (cache.dataFeeds) return cache.dataFeeds;
  let listFeeds = [];
  for await (const datatFeed of adminClient.listDataFeeds()) {
    //console.log(`id :${datatFeed.id}, name: ${datatFeed.name}`);
    listFeeds.push(datatFeed);
  }
  cache.dataFeeds = listFeeds;
  return listFeeds;
}

async function getDetectionConfigs(metricId) {
  //console.log(`Listing detection configurations for metric '${metricId}'...`);

  if (cache.detectionConfigs[metricId]) return cache.detectionConfigs[metricId];
  var detectionConfigs = [];
  for await (const config of adminClient.listMetricAnomalyDetectionConfigurations(
    metricId
  )) {
    if(!config.name.startsWith("detection-all-as-anomalies")){
      detectionConfigs.push(config);
    }    
  }
  detectionConfigs.reverse();
  cache.detectionConfigs[metricId] = detectionConfigs;
  return detectionConfigs;
  // if (detectionConfigs.length > 0) return detectionConfigs;
  // else return mockedConfigs;
}

async function getEnrichedSeriesData(detectionConfigId) {
  //console.log("Retrieving metric enriched series data...");
  if (cache.enrichedSeries[detectionConfigId])
    return cache.enrichedSeries[detectionConfigId];
  const result = await client.getMetricEnrichedSeriesData(
    detectionConfigId,
    new Date("08/21/2020"),
    new Date("09/21/2020"),
    [
      { dimension: { city: "Chicago", category: "Shoes Handbags & Sunglasses" } },
      {
        dimension: {
          city: "Manila",
          category: "Cell Phones",
        },
      },
      { dimension: { city: "Osaka", category: "Handmade" } },
    ]
  );

  cache.enrichedSeries[detectionConfigId] = result.results;
  return result.results || [];
  // if (result.results.length > 0) {
  //   return result.results;
  // }

  // if (detectionConfigId.startsWith("3")) {
  //   return mockedSeriesData;
  // } else {
  //   return [mockedSeriesData[1], mockedSeriesData[0]];
  // }
}

async function getIncidents(detectionConfigId) {
  if (cache.incidents[detectionConfigId])
    return cache.incidents[detectionConfigId];
  const incidentList = client.listIncidentsForDetectionConfiguration(
    detectionConfigId,
    new Date("08/21/2020"),
    new Date("09/21/2020")
  );
  let cachedIncidents = [];
  for await (const incident of incidentList) {
    cachedIncidents.push(incident);
  }

  cache.incidents[detectionConfigId] = cachedIncidents;
  // if (cachedIncidents.length > 0) {
  // console.table(cachedIncidents,[
  //   "id",
  //   "severity",
  //   "status",
  //   "startTime",
  //   "endTime",
  //   "detectionConfigurationId"
  // ] )
  return cachedIncidents;
  // }
  // if (detectionConfigId.startsWith("3")) return mockedIncidents;
  // else
  //   return [
  //     { ...mockedIncidents[0], id: "555555555555555555555555555555555" },
  //     { ...mockedIncidents[1], id: "666666666666666666666666666666666" },
  //     { ...mockedIncidents[1], id: "777777777777777777777777777777777" },
  //   ];
}

async function getAnomalies(incident, detecionConfigId) {
  if (cache.anomalies[incident.id]) return cache.anomalies[incident.id];
  const result = [];

  const { startTime, lastOccuredTime } = incident;
  if (startTime.getTime() >= lastOccuredTime.getTime()) {
    lastOccuredTime.setTime(startTime.getTime() + 10 * 60 * 1000);
  }
  for await (const a of client.listAnomaliesForDetectionConfiguration(
    detecionConfigId,
    startTime,
    lastOccuredTime
  )) {
    result.push(a);
  }

  cache.anomalies[incident.id] = result;
  return result;
}

function toDisplayString(dimensionKey) {
  let final = "";
  for (const key of Object.keys(dimensionKey).sort()) {
    final += `${key} = ${dimensionKey[key]}; `;
  }

  return final;
}
async function getRootCause(incidentId, detectionConfigId) {
  //console.log("Retrieving root causes...");
  const result = await client.getIncidentRootCauses(
    detectionConfigId,
    incidentId
  );
  //console.log(result.rootCauses);
  if (result.rootCauses.length > 0) return result.rootCauses;

  if (incientId.startsWith("5")) {
    return mockedRootCauses2;
  } else {
    return mockedRootCauses;
  }
}

async function provideAnomalyFeedback(metricId){
  //console.log("whether a point should or shouldn't be an anomaly");
  const anomalyFeedback = {
    metricId,
    feedbackType: "Anomaly",
    startTime: new Date("2020/08/05"),
    endTime: new Date("2020/08/07"),
    value: "NotAnomaly",
    dimensionFilter: { dimension: { Dim1: "Common Lime", Dim2: "Ant" } }
  };
  return await client.createMetricFeedback(anomalyFeedback);
}

async function providePeriodFeedback(metricId) {
  //console.log("automatically or manually detect intervals of seasonality");
  const periodFeedback = {
    metricId,
    feedbackType: "Period",
    periodType: "AutoDetect",
    periodValue: 4,
    dimensionFilter: { dimension: { Dim1: "Common Lime", Dim2: "Ant" } },
  };
  return await client.createMetricFeedback(periodFeedback);
}

async function provideChangePointFeedback(metricId) {
  //console.log("If the point indicates start of a trend change");
  const changePointFeedback = {
    metricId,
    feedbackType: "ChangePoint",
    startTime: new Date("2020/08/05"),
    value: "ChangePoint",
    dimensionFilter: { dimension: { Dim1: "Common Lime", Dim2: "Ant" } },
  };
  return await client.createMetricFeedback(changePointFeedback);
}




async function provideCommentFeedback(metricId) {
  //console.log("Creating a comment feedback...");
  const commendFeedback = {
    metricId,
    feedbackType: "Comment",
    dimensionFilter: { dimension: { Dim1: "Common Lime", Dim2: "Amphibian" } },
    comment: "This is a comment",
  };
  return await client.createMetricFeedback(commendFeedback);
}



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

const mockedConfigs = JSON.parse(
  '[{"id":"342346a5-4e6d-4cb7-9a0a-41901bdedb52","name":"detection-treat-all-as-anomalies","description":"fresh detection","metricId":"802153a9-1671-4a6f-901e-66bbf09384d9","wholeSeriesDetectionCondition":{"conditionOperator":"AND","hardThresholdCondition":{"upperBound":0,"anomalyDetectorDirection":"Up","suppressCondition":{"minNumber":1,"minRatio":100}},"changeThresholdCondition":{"changePercentage":33,"shiftPoint":1,"withinRange":true,"anomalyDetectorDirection":"Both","suppressCondition":{"minNumber":2,"minRatio":2}}},"seriesGroupDetectionConditions":[],"seriesDetectionConditions":[]},{"id":"59f26a57-55f7-41eb-8899-a7268d125557","name":"Default","description":"","metricId":"802153a9-1671-4a6f-901e-66bbf09384d9","wholeSeriesDetectionCondition":{"smartDetectionCondition":{"sensitivity":100,"anomalyDetectorDirection":"Up","suppressCondition":{"minNumber":1,"minRatio":100}}},"seriesGroupDetectionConditions":[],"seriesDetectionConditions":[]}]'
);

const mockedSeriesData = JSON.parse(
  '[{"series":{"dimension":{"city":"Osaka","category":"Handmade"}},"timestampList":["2020-08-21T00:00:00.000Z","2020-08-22T00:00:00.000Z","2020-08-23T00:00:00.000Z","2020-08-24T00:00:00.000Z","2020-08-25T00:00:00.000Z","2020-08-26T00:00:00.000Z","2020-08-27T00:00:00.000Z","2020-08-28T00:00:00.000Z","2020-08-29T00:00:00.000Z","2020-08-30T00:00:00.000Z","2020-08-31T00:00:00.000Z","2020-09-01T00:00:00.000Z","2020-09-02T00:00:00.000Z","2020-09-03T00:00:00.000Z","2020-09-04T00:00:00.000Z","2020-09-05T00:00:00.000Z","2020-09-06T00:00:00.000Z","2020-09-07T00:00:00.000Z","2020-09-08T00:00:00.000Z","2020-09-09T00:00:00.000Z","2020-09-10T00:00:00.000Z","2020-09-11T00:00:00.000Z","2020-09-12T00:00:00.000Z","2020-09-13T00:00:00.000Z","2020-09-15T00:00:00.000Z","2020-09-16T00:00:00.000Z","2020-09-17T00:00:00.000Z"],"valueList":[149429.6,110067.20000000001,117937.20000000001,207251.2,229310.80000000002,237734.2,241376.2,210359.80000000002,120388,122554.40000000001,230825,244037.2,253433.6,259973.40000000002,230110.80000000002,131875.4,135286,257134,273380,289543.2,296011,263613.2,148879.80000000002,152979,244067.80000000002,196114,316396],"isAnomalyList":[true,true,true,false,true,true,true,true,false,true,false,true,true,true,true,false,true,false,true,true,true,true,false,true,null,true,false],"periodList":[7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],"expectedValueList":[152855.40258322348,65354.58666783161,76323.88259832346,202311.03385206388,222228.56326818833,235647.8580494554,237185.84382915,213588.65790101298,116663.01496458295,118207.48387403664,235006.56117000154,248074.88629422698,254593.00180702182,254629.69202707225,231045.08230857673,135818.08922812183,139860.3769181726,258920.5199314719,274419.5130485158,283420.27153070224,291117.9615006614,267743.5982079437,176157.69764642263,157324.94319413725,246790.16849601746,263961.9560202353,259247.97610554672],"lowerBoundaryList":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"upperBoundaryList":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]},{"series":{"dimension":{"city":"Manila","category":"Shoes Handbags & Sunglasses"}},"timestampList":["2020-08-21T00:00:00.000Z","2020-08-22T00:00:00.000Z","2020-08-23T00:00:00.000Z","2020-08-24T00:00:00.000Z","2020-08-25T00:00:00.000Z","2020-08-26T00:00:00.000Z","2020-08-27T00:00:00.000Z","2020-08-28T00:00:00.000Z","2020-08-29T00:00:00.000Z","2020-08-30T00:00:00.000Z","2020-08-31T00:00:00.000Z","2020-09-01T00:00:00.000Z","2020-09-02T00:00:00.000Z","2020-09-03T00:00:00.000Z","2020-09-04T00:00:00.000Z","2020-09-05T00:00:00.000Z","2020-09-06T00:00:00.000Z","2020-09-07T00:00:00.000Z","2020-09-08T00:00:00.000Z","2020-09-09T00:00:00.000Z","2020-09-10T00:00:00.000Z","2020-09-11T00:00:00.000Z","2020-09-12T00:00:00.000Z","2020-09-13T00:00:00.000Z","2020-09-15T00:00:00.000Z","2020-09-16T00:00:00.000Z","2020-09-17T00:00:00.000Z"],"valueList":[4135463.4000000004,3398402.8000000003,5624620,6302798.2,6235636,6227662,6183055.800000001,4140718.6,3406581.2,5622781.4,6279117,6336467,6332000.800000001,6287129.2,4197455.8,3489124.6,5782855.4,6370222.4,6281192.800000001,6238987.600000001,6216528,4244261,3456991.2,5681077.600000001,6231375.600000001,6254398,6211613.800000001],"isAnomalyList":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"periodList":[7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],"expectedValueList":[4104577.2628565608,3383045.646480889,5595037.582299467,6308499.660757769,6251528.677425608,6224344.696485896,6175355.170548956,4144627.9600195633,3424117.218246096,5640233.575719596,6358921.406435414,6314790.957631784,6297174.973473459,6256431.575222806,4215724.259255751,3474816.0772137856,5665505.485650316,6357665.036726569,6286642.026953129,6245406.019572138,6224019.419272247,4203473.949544372,3459625.618670659,5677389.15206928,6253216.641322659,6247439.452270282,6209349.995722721],"lowerBoundaryList":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"upperBoundaryList":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}]'
);

const mockedIncidents = JSON.parse(
  '[{"id":"34c3049e81884472e3bf3eba76971eeb-1747a763000","detectionConfigurationId":"59f26a57-55f7-41eb-8899-a7268d125557","dimensionKey":{"dimension":{"city":"Khartoum","category":"__SUM__"}},"status":"Active","severity":"Low","startTime":"2020-09-09T00:00:00.000Z","lastOccuredTime":"2020-09-11T00:00:00.000Z"},{"id":"3177d3ddcddc5fac970cb34193902f8e-1747a763000","detectionConfigurationId":"59f26a57-55f7-41eb-8899-a7268d125557","dimensionKey":{"dimension":{"city":"Chicago","category":"Software & Computer Games"}},"status":"Active","severity":"Low","startTime":"2020-09-11T00:00:00.000Z","lastOccuredTime":"2020-09-11T00:00:00.000Z"}]'
);

const mockedRootCauses = JSON.parse(
  '[{"dimensionKey":{"dimension":{"city":"__SUM__","category":"Electronics (Accessories)"}},"path":[],"score":1,"description":"All sub series contribute to current incident under category = Electronics (Accessories)"}]'
);
const mockedRootCauses2 = JSON.parse(
  '[{"dimensionKey":{"dimension":{"category":"Office Products","city":"Karachi"}},"path":["city"],"score":0.2382570419169871,"description":"Increase on category = Office Products | city = Karachi contributes the most to current incident."}]'
);

var startTime = new Date("09/06/2020");
var lastOccuredTime = new Date("09/11/2020");
module.exports.getDataFeeds = getDataFeeds;
module.exports.getDetectionConfigs = getDetectionConfigs;
module.exports.getEnrichedSeriesData = getEnrichedSeriesData;
module.exports.getIncidents = getIncidents;
module.exports.getRootCause = getRootCause;
// module.exports.provideChangePointFeedback = provideChangePointFeedback(
//   metricId
// );
// module.exports.provideCommentFeedback = provideCommentFeedback(metricId);
// module.exports.providePeriodFeedback = providePeriodFeedback(metricId);
module.exports.getAnomalies = getAnomalies;
module.exports.toDisplayString = toDisplayString;
