const blessed = require("blessed");
const contrib = require("blessed-contrib");
const fs = require("fs");
const { splash, baseConfig, filePaths, colorScheme } = require("./constants");
const {
  getDataFeeds,
  getDetectionConfigs,
  getSeriesData,
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
  const { timestampList, valueList, isAnomalyList } = enrichedSeriesData;
  if (timestampList && timestampList.length > 0) {
    const timestamps = timestampList.map((t) => new Date(t).toDateString());
    return {
      title: series,
      values: {
        title: "Mesure",
        x: timestamps,
        y: valueList,
        points: isAnomalyList.map((v) => (v ? "A" : undefined)),
      },
      lowerBounds: {
        title: "lower bounds",
        x: timestamps,
        y: lowerBoundaryList,
      },
      upperBounds: {
        title: "lower bounds",
        x: timestamps,
        y: upperBoundaryList,
      },
      style: {
        line: "white",
      },
      pointStyle: "red",
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
let menubar = null;
let series1Chart = null;
let series2Chart = null;
let series3Chart = null;
let statusBar = null;

let configs = null;
let focused = null;
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

  metricsTable = grid.set(
    0,
    0,
    5,
    13,
    blessed.ListTable,
    createListTable("left", null, true)
  );

  detectionConfigsTable = grid.set(
    5,
    0,
    5,
    13,
    blessed.ListTable,
    createListTable("left", padding, true)
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
    menubar.emit("attach");
    series2Chart.emit("attach");
    series3Chart.emit("attach");
  });

  // cycle among metric and detection config tables
  // screen.key(["tab"], (ch, key) => {
  //   if (focused === metricsTable || !focused) {
  //     detectionConfigsTable.focus();
  //     focused = detectionConfigsTable;
  //     detectionConfigsTable.selected = detectionConfigsTable.selected || 1;
  //   } else if (focused === detectionConfigsTable) {
  //     metricsTable.focus();
  //     focused = metricsTable;
  //     metricsTable.selected = metricsTable.selected || 1;
  //   }

  //   refreshInterface();
  // });

  screen.key(["tab"], (ch, key) => {
    screen.focusNext();
  });

  // Open detection configuration
  screen.key(["enter"], (ch, key) => {
    if (focused === metricsTable) {
      metric = metrics[metricsTable.selected - 1];
    } else if (focused === detectionConfigsTable || !focused) {
      focused = detectionConfigsTable;
      detectionConfig = configs[detectionConfigsTable.selected - 1];
      statusBar.log(
        `after enter, table 2 selected is now ${detectionConfigsTable.selected}`
      );
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

  const seriesData = await getSeriesData(metricId);

  // const dataFeedData = dataFeeds.map((feed) => {
  //   let data = [];
  //   data[0] = feed.name;
  //   data[1] = feed.id;
  //   return data;
  // });

  const selectedFeed = dataFeeds[1];

  metrics = selectedFeed.schema.metrics;
  const metricData = metrics.map((metric) => {
    let data = [];
    data[0] = metric.name;
    data[1] = metric.description;
    return data;
  });

  const selectedMetric = metrics[(metricsTable.selected || 1) - 1];

  const configData = configs.map((c) => {
    return [c.name, c.description];
  });

  // Set headers for each table
  metricData.splice(0, 0, ["Metric Name", "Description"]);
  configData.splice(0, 0, ["Detection Config Name", "Description"]);

  let oldSelected = metricsTable.selected;
  metricsTable.setData(metricData);
  metricsTable.selected = oldSelected || 1;

  oldSelected = detectionConfigsTable.selected;
  detectionConfigsTable.setData(configData);
  detectionConfigsTable.selected = oldSelected || 1;

  //series1Chart.setData(transformedSeriesData(seriesData[0]));
  series1Chart.setData(seriesData[0]);
  series1Chart.setLabel(
    " Series: city = 'Redmond' category = 'Home & Garden' "
  );

  // if (!focused) {
  //   detectionConfigsTable.focus();
  // }

  screen.render();
}

main().catch((e) => {
  statusBar.log(e);
});
