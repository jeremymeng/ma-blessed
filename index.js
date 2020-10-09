const blessed = require("blessed");
const contrib = require("blessed-contrib");
const fs = require("fs");
const { splash, baseConfig, filePaths, colorScheme } = require("./constants");

async function main() {
  console.log(splash.logo);
  console.log(splash.description);
  console.log("Press any key to continue");

  // process.stdin.setRawMode(true);
  // process.stdin.resume();
  // process.stdin.on("data", () =>
  {
    createConfig();
    if (+new Date() >= getConfig().lastRefresh + 5 * 60 * 1000) {
      fetchIntialData();
    }

    createInterface();
    refreshInterface();

    // setInterval(() => refreshInterface(), refreshRate);
  }
  // );
}

function storeLastSync(lastRefresh = +new Date()) {
  writeJSONFile(filePaths.configPath, {
    ...getConfig(),
    lastRefresh,
  });
}

function updateData() {
  // fetch data feeds
}

function fetchIntialData() {
  updateData();

  storeLastSync();
}

function readJSONFile(path, waitForSuccess = true) {
  if (!fs.existsSync(path)) {
    // setTimeout(() => readJSONFile(path), 2000);
    return null;
  } else {
    let JSONFile = fs.readFileSync(path, "utf8");
    while (!JSONFile && waitForSuccess) {
      JSONFile = fs.readFileSync(path, "utf8");
    }

    return JSON.parse(JSONFile);
  }
}

function writeJSONFile(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

function createConfig() {
  if (!fs.existsSync(filePaths.configPath)) {
    writeJSONFile(filePaths.configPath, baseConfig);
  }
}

function getConfig() {
  return readJSONFile(filePaths.configPath);
}

// BLESSED INTERFACE HELPERS //
/* [insert obligatory "bless up" comment] */

let screen = null;
let grid = null;
let dataFeedsTable = null;
let dataFeedsTableSelected = null;
let metricsTable = null;
let metricsTableSelected = null;
let metrics = null;
let detectionConfigsTable = null;
let detectionConfigsTableSelected = null;
let menubar = null;
let series1Chart = null;
let series2Chart = null;
let series3Chart = null;
let statusBar = null;

let dataFeeds = null;
let configs = null;
let focused = null;
let status = null;

function buildMenuCommands() {
  const cmds = {};
  return cmds;
}

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

  series3Chart = grid.set(20, 13, 10, 23, contrib.line, {
    style: {
      line: "yellow",
      text: "green",
      baseline: "black",
    },
    xLabelPadding: 3,
    xPadding: 5,
    // showLegend: true,
    wholeNumbersOnly: true,
    label: " Series 3 ".bold.red,
  });

  detectionConfigsTable.focus();
  focused = detectionConfigsTable;

  // Create menu
  menubar = blessed.listbar({
    parent: screen,
    keys: true,
    bottom: 0,
    left: 0,
    height: 1,
    style: {
      item: {
        fg: "yellow",
      },
      selected: {
        fg: "yellow",
      },
    },
    commands: buildMenuCommands(),
  });

  statusBar = grid.set(30, 0, 5, 36, blessed.log, {
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

function refreshInterface() {
  // const dataFeeds = readJSONFile(filePaths.dataFeedDataPath);
  dataFeeds = {
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

  configs = {
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

  // first enriched series of default detection
  const seriesData = {
    id1: [
      {
        title: "us-east",
        x: ["t1", "t2", "t3", "t4"],
        y: [50, 88, 72, 91],
        points: ["A", "", "Ⓐ", ""],
        style: {
          line: "white",
        },
        pointStyle: "red",
      },
    ],
    m1: [
      {
        title: "us-west",
        x: ["t1", "t2", "t3", "t4"],
        y: [99, 44, 22, 55],
        points: ["", "", "", "A"],
        style: {
          line: "white",
        },
        pointStyle: "red",
      },
    ],
  };

  const dataFeedData = dataFeeds.data.map((feed) => {
    let data = [];
    data[0] = feed.name;
    data[1] = feed.id;
    return data;
  });

  const selectedFeed = dataFeeds.data[1];

  metrics = selectedFeed.schema.metrics;
  const metricData = metrics.map((metric) => {
    let data = [];
    data[0] = metric.name;
    data[1] = metric.description;
    return data;
  });

  const selectedMetric = metrics[(metricsTable.selected || 1) - 1];

  const configData = configs[selectedMetric.id].map((c) => {
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

  series1Chart.setData(seriesData[configs[selectedMetric.id][0].id]);
  series1Chart.setLabel(
    " Series: city = 'Redmond' category = 'Home & Garden' "
  );

  // if (!focused) {
  //   detectionConfigsTable.focus();
  // }

  screen.render();
}

main().catch((e) => {
  console.log(e);
});
