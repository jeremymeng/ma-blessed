const blessed = require("blessed");
const contrib = require("blessed-contrib");
const fs = require("fs");
const { splash, baseConfig, filePaths, colorScheme } = require("./constants");
const {
  getDataFeeds,
  getDetectionConfigs,
  getEnrichedSeriesData,
  getIncidents,
} = require("./mahelpers");

async function main() {
  console.log(splash.logo);
  console.log(splash.description);
  console.log("Press any key to continue");

  // process.stdin.setRawMode(true);
  // process.stdin.resume();
  // process.stdin.on("data", () =>
  {
    createInterface();
    await refreshInterface();
  }
  // );
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
      title: JSON.stringify(enrichedSeriesData.series.dimension),
      values: {
        title: "Mesure",
        x: timestamps,
        y: valueList,
        points: isAnomalyList.map((v) => (v === false ? "A" : undefined)),
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
let metricsTable = null;
let metrics = null;
let detectionConfigsTable = null;
let incidents = null;
let incidentsTable = null;
let series1Chart = null;
let series2Chart = null;
let statusBar = null;

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
    1,
    0,
    5,
    13,
    blessed.ListTable,
    createListTable("left", null, true)
  );

  incidentsTable = grid.set(
    6,
    0,
    5,
    13,
    blessed.ListTable,
    createListTable("left", null, true)
  );

  series1Chart = grid.set(0, 13, 10, 23, contrib.line, {
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

  series2Chart = grid.set(10, 13, 10, 23, contrib.line, {
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

  statusBar = grid.set(20, 0, 15, 36, blessed.log, {
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

  // Resizing
  screen.on("resize", () => {
    //metricsTable.emit("attach");
    detectionConfigsTable.emit("attach");
    incidentsTable.emit("attach");
    series2Chart.emit("attach");
    // series3Chart.emit("attach");
  });

  // cycle among metric and detection config tables
  screen.key(["tab"], (ch, key) => {
    if (focused === incidentsTable || !focused) {
      detectionConfigsTable.focus();
      focused = detectionConfigsTable;
      detectionConfigsTable.selected = detectionConfigsTable.selected || 1;
    } else if (focused === detectionConfigsTable) {
      incidentsTable.focus();
      focused = incidentsTable;
      incidentsTable.selected = incidentsTable.selected || 1;
    }

    refreshInterface();
  });

  // Open detection configuration
  screen.key(["enter"], (ch, key) => {
    if (focused === detectionConfigsTable || !focused) {
      focused = detectionConfigsTable;
      detectionConfig = configs[detectionConfigsTable.selected - 1];
      statusBar.log(
        `after enter, table 2 selected is now ${detectionConfigsTable.selected}`
      );
    } else if (focused === incidentsTable) {
      statusBar.log(
        `Showing details for incident ${
          incidents[incidentsTable.selected - 1].id
        }`
      );
      // show incident detail and root causes
    }

    refreshInterface();
  });

  // Quit
  screen.key(["escape", "C-c", "q", "Q"], (ch, key) => process.exit(0));
}

async function refreshInterface() {
  const dataFeeds = await getDataFeeds();
  const metricId = dataFeeds[1].schema.metrics[0].id;
  configs = await getDetectionConfigs(metricId);

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

  const seriesData = await getEnrichedSeriesData(selectedConfig.id);

  const configData = configs.map((c) => {
    return [c.name, c.description];
  });

  incidents = await getIncidents(selectedConfig.id);
  const incidentData = incidents.map((i) => {
    return [`${i.id.substr(0, 10)}...`, i.status, i.severity, i.startTime];
  });

  // Set headers for each table
  configData.splice(0, 0, ["Name", "Description"]);
  incidentData.splice(0, 0, ["Id", "Status", "Severity", "Started at"]);

  oldSelected = detectionConfigsTable.selected;
  detectionConfigsTable.setData(configData);
  detectionConfigsTable.selected = oldSelected || 1;

  //series1Chart.setData(transformedSeriesData(seriesData[0]));
  let seriesToPlot = transformEnrichedSerieData(seriesData[0]);
  series1Chart.setData([seriesToPlot.values]);
  series1Chart.setLabel(seriesToPlot.title);

  seriesToPlot = transformEnrichedSerieData(seriesData[1]);
  series2Chart.setData([seriesToPlot.values]);
  series2Chart.setLabel(seriesToPlot.title);

  oldSelected = incidentsTable.selected;
  incidentsTable.setData(incidentData);
  incidentsTable.selected = oldSelected || 1;

  screen.render();
}

main().catch((e) => {
  statusBar.log(e);
});
