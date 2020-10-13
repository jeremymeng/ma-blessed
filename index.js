const blessed = require("blessed");
const contrib = require("blessed-contrib");
const fs = require("fs");
const { splash, colorScheme } = require("./constants");
const {
  getDataFeeds,
  getDetectionConfigs,
  getEnrichedSeriesData,
  getIncidents,
  getAnomalies,
  getRootCause,
  toDisplayString,
} = require("./mahelpers");

async function main() {
  console.log(splash.logo);
  console.log(splash.description);
  await delay(1000);

  // process.stdin.setRawMode(true);
  // process.stdin.resume();
  // process.stdin.on("data", async () =>
  {
    createInterface();
    refreshInterface();
  }
  //);
}

function transformEnrichedSerieData(enrichedSeriesData) {
  const {
    timestampList,
    valueList,
    isAnomalyList,
    lowerBoundaryList,
    upperBoundaryList,
  } = enrichedSeriesData;
  if (timestampList && timestampList.length > 0) {
    const timestamps = timestampList.map((t) => {
      const d = new Date(t);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    return {
      title: ` ${toDisplayString(enrichedSeriesData.series.dimension)} `,
      values: {
        title: "Mesure",
        x: timestamps,
        y: valueList,
        points: isAnomalyList.map((v) => (v === true ? "A" : undefined)),
        style: {
          line: "white",
        },
        pointStyle: "red",
      },
      // lowerBounds: {
      //   title: "lower bounds",
      //   x: timestamps,
      //   y: lowerBoundaryList,
      // },
      // upperBounds: {
      //   title: "lower bounds",
      //   x: timestamps,
      //   y: upperBoundaryList,
      // },
    };
  }
}

// BLESSED INTERFACE HELPERS //
/* [insert obligatory "bless up" comment] */

let screen = null;
let grid = null;
let titleText = null;
let metricsTable = null;
let metrics = null;
let detectionConfigsTable = null;
let incidents = null;
let incidentsTable = null;
let series1Chart = null;
let series2Chart = null;
let incidentDetailText = null;
let incidentToShow = null;
let statusBar = null;
let loader = null;

let configs = null;
let focused = null;
let selectedConfig = null;
// BLESSED HELPERS //

function createListTable(alignment, padding, isInteractive = false) {
  return {
    parent: screen,
    keys: true,
    align: alignment,
    selectedFg: "white",
    selectedBg: "blue",
    interactive: isInteractive, // Makes the list table scrollable
    padding: padding,
    style: {
      fg: colorScheme.tableText,
      border: {
        fg: colorScheme.border,
      },
      cell: {
        selected: {
          fg: "black",
          bg: "light-yellow",
        },
      },
      header: {
        fg: "red",
        bold: true,
      },
    },
    columnSpacing: 1,
  };
}

function createInterface() {
  let padding = {
    left: 1,
    right: 1,
  };

  screen = blessed.screen({
    smartCSR: true,
    title: "M.A. CLI",
    cursor: {
      artificial: true,
      shape: "line",
      blink: true,
      color: "red",
    },
  });

  grid = new contrib.grid({
    rows: 36,
    cols: 36,
    screen: screen,
  });

  // Create dashboard widgets
  // dataFeedsTable = grid.set(
  //   0,
  //   0,
  //   10,
  //   13,
  //   blessed.ListTable,
  //   createListTable("left", null, true)
  // );

  // metricsTable = grid.set(
  //   0,
  //   0,
  //   5,
  //   13,
  //   blessed.ListTable,
  //   createListTable("left", null, true)
  // );

  detectionConfigsTable = grid.set(
    3,
    0,
    6,
    13,
    blessed.ListTable,
    createListTable("left", padding, true)
  );

  incidentsTable = grid.set(
    10,
    0,
    13,
    13,
    blessed.ListTable,
    createListTable("left", padding, true)
  );

  titleText = grid.set(0, 0, 3, 36, blessed.text, {
    parent: screen,
    top: "center",
    left: "center",
    width: "100%",
    height: "100%",
    content: "Datafeed:  Metric:",
  });

  series1Chart = grid.set(3, 13, 10, 23, contrib.line, {
    style: {
      line: "yellow",
      text: "green",
      baseline: "black",
    },
    xLabelPadding: 3,
    xPadding: 5,
    // showLegend: true,
    wholeNumbersOnly: true,
    label: " Series 1 ".bold.red,
  });

  series2Chart = grid.set(13, 13, 10, 23, contrib.line, {
    style: {
      line: "yellow",
      text: "green",
      baseline: "black",
    },
    xLabelPadding: 3,
    xPadding: 5,
    // showLegend: true,
    wholeNumbersOnly: true,
    label: " Series 2 ".bold.red,
  });

  // series3Chart = grid.set(20, 13, 10, 23, contrib.line, {
  //   style: {
  //     line: "yellow",
  //     text: "green",
  //     baseline: "black",
  //   },
  //   xLabelPadding: 3,
  //   xPadding: 5,
  //   // showLegend: true,
  //   wholeNumbersOnly: true,
  //   label: " Series 3 ".bold.red,
  // });

  detectionConfigsTable.focus();
  focused = detectionConfigsTable;

  incidentDetailText = grid.set(23, 0, 9, 36, blessed.text, {
    parent: screen,
    top: "center",
    left: "center",
    width: "100%",
    height: "100%",
    content: "Incident Details",
  });

  statusBar = grid.set(32, 0, 4, 36, blessed.log, {
    parent: screen,
    top: "70",
    left: "center",
    width: "100%",
    height: "2",
    border: "line",
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollback: 100,
    scrollbar: {
      ch: " ",
      track: {
        bg: "yellow",
      },
      style: {
        inverse: true,
      },
    },
  });

  loader = blessed.loading({
    parent: screen,
    border: "line",
    height: "shrink",
    width: "half",
    top: "center",
    left: "center",
    label: " {blue-fg}Running{/blue-fg} ",
    tags: true,
    keys: true,
    hidden: true,
    vi: true,
  });

  // Resizing
  screen.on("resize", () => {
    //metricsTable.emit("attach");
    detectionConfigsTable.emit("attach");
    incidentsTable.emit("attach");
    incidentDetailText.emit("attach");
    series2Chart.emit("attach");
    // series3Chart.emit("attach");
  });

  // cycle among metric and detection config tables
  screen.key(["tab"], async (ch, key) => {
    if (focused === incidentsTable || !focused) {
      detectionConfigsTable.focus();
      focused = detectionConfigsTable;
      detectionConfigsTable.selected = detectionConfigsTable.selected || 1;
    } else if (focused === detectionConfigsTable) {
      incidentsTable.focus();
      focused = incidentsTable;
      incidentsTable.selected = incidentsTable.selected || 1;
    }

    await refreshInterface();
  });

  // Open detection configuration
  screen.key(["enter"], async (ch, key) => {
    if (focused === detectionConfigsTable || !focused) {
      focused = detectionConfigsTable;
      detectionConfig = configs[detectionConfigsTable.selected - 1];
      incidentToShow = undefined;
      statusBar.log(
        `Selected detectionc configuration '${detectionConfig.name}'`
      );
    } else if (focused === incidentsTable) {
      incidentToShow = incidents[incidentsTable.selected - 1];
      statusBar.log(`Showing details for incident ${incidentToShow.id}`);
    }

    await refreshInterface();
  });

  // Quit
  screen.key(["escape", "C-c", "q", "Q"], (ch, key) => process.exit(0));
}

async function refreshInterface() {
  const dataFeeds = await getDataFeeds();
  const metricId = "802153a9-1671-4a6f-901e-66bbf09384d9";

  titleText.setContent(
    `Data feed:  'AZ SQL Data Feed'; Metric: 'Cost'`
  );

  loader.load("Retrieving detection configurations from service...");
  configs = await getDetectionConfigs(metricId);
  loader.stop();

  // const dataFeedData = dataFeeds.map((feed) => {
  //   let data = [];
  //   data[0] = feed.name;
  //   data[1] = feed.id;
  //   return data;
  // });

  // const selectedFeed = dataFeeds[1];

  // metrics = selectedFeed.schema.metrics;
  // const metricData = metrics.map((metric) => {
  //   let data = [];
  //   data[0] = metric.name;
  //   data[1] = metric.description;
  //   return data;
  // });

  selectedConfig = configs[(detectionConfigsTable.selected || 1) - 1];

  loader.load("Retrieving enriched series data from service...");
  const seriesData = await getEnrichedSeriesData(selectedConfig.id);
  loader.stop();

  const configData = configs.map((c) => {
    return [
      c.name.length > 15 ? `${c.name.substr(0, 12)}...` : c.name,
      c.description,
    ];
  });

  loader.load("Retrieving incidents for detection config...");
  incidents = await getIncidents(selectedConfig.id);
  loader.stop();
  statusBar.log(
    `Received ${incidents.length} incident(s) for detection config ${selectedConfig.id}`
  );

  const incidentData = incidents.map((i) => {
    return [
      `${i.id.substr(0, 10)}...`,
      i.status || "",
      i.severity || "",
      i.startTime ? i.startTime.toDateString() : "",
    ];
  });

  // Set headers for each table
  configData.splice(0, 0, ["Detection Config", "Description"]);
  incidentData.splice(0, 0, [
    "Incident Id",
    "Status",
    "Severity",
    "Started at",
  ]);

  oldSelected = detectionConfigsTable.selected;
  detectionConfigsTable.setData(configData);
  detectionConfigsTable.selected = oldSelected || 1;

  //series1Chart.setData(transformedSeriesData(seriesData[0]));
  let seriesToPlot = transformEnrichedSerieData(seriesData[0]);
  if (seriesToPlot) {
    series1Chart.setData([seriesToPlot.values]);
    series1Chart.setLabel(seriesToPlot.title);
  }
  seriesToPlot = transformEnrichedSerieData(seriesData[1]);
  if (seriesToPlot) {
    series2Chart.setData([seriesToPlot.values]);
    series2Chart.setLabel(seriesToPlot.title);
  }

  oldSelected = incidentsTable.selected;
  statusBar;
  incidentsTable.setData(incidentData);
  incidentsTable.selected =
    oldSelected <= incidentData.length ? oldSelected : incidentData.length;

  if (incidentToShow) {
    loader.load("Retrieving anomalies and root causes for incident...");
    const anomalies = await getAnomalies(incidentToShow, selectedConfig.id);
    const causes = await getRootCause(incidentToShow.id, selectedConfig.id);
    loader.stop();

    const rootCauses = causes.map((r, index) => {
      let path = "";
      for (const segment of r.path) {
        path += "=> ";
        path += segment;
      }
      return `Series ${index + 1}: ${toDisplayString(
        r.dimensionKey.dimension
      )}, score: ${r.score}, ${path ? "path: " + path : ""}
                  description: ${r.description}`;
    });
    incidentDetailText.setContent(
      `Details information about incident ${incidentToShow.id}

      Severity: ${incidentToShow.severity}          # of anomalies: ${anomalies.length}

      Start time: ${incidentToShow.startTime}             Last occurred: ${incidentToShow.lastOccuredTime}

      Root cause(s):
        ${rootCauses}
      `
    );
  } else {
    incidentDetailText.setContent("Incident details");
  }

  screen.render();
}

async function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
main().catch((e) => {
  statusBar.log(e);
});
