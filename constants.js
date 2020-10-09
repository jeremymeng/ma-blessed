const path = require("path");
const colors = require("colors");

module.exports = {
  splash: {
    logo: `

  ▄▄       ▄▄     ▄▄▄▄▄▄▄▄▄▄▄          ▄▄▄▄▄▄▄▄▄▄▄  ▄            ▄▄▄▄▄▄▄▄▄▄▄ 
  ▐░░▌     ▐░░▌   ▐░░░░░░░░░░░▌        ▐░░░░░░░░░░░▌▐░▌          ▐░░░░░░░░░░░▌
  ▐░▌░▌   ▐░▐░▌   ▐░█▀▀▀▀▀▀▀█░▌        ▐░█▀▀▀▀▀▀▀▀▀ ▐░▌           ▀▀▀▀█░█▀▀▀▀ 
  ▐░▌▐░▌ ▐░▌▐░▌   ▐░▌       ▐░▌        ▐░▌          ▐░▌               ▐░▌     
  ▐░▌ ▐░▐░▌ ▐░▌   ▐░█▄▄▄▄▄▄▄█░▌        ▐░▌          ▐░▌               ▐░▌     
  ▐░▌  ▐░▌  ▐░▌   ▐░░░░░░░░░░░▌        ▐░▌          ▐░▌               ▐░▌     
  ▐░▌   ▀   ▐░▌   ▐░█▀▀▀▀▀▀▀█░▌        ▐░▌          ▐░▌               ▐░▌     
  ▐░▌       ▐░▌   ▐░▌       ▐░▌        ▐░▌          ▐░▌               ▐░▌     
  ▐░▌       ▐░▌ ▄ ▐░▌       ▐░▌ ▄      ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄  ▄▄▄▄█░█▄▄▄▄ 
  ▐░▌       ▐░▌▐░▌▐░▌       ▐░▌▐░▌     ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌
   ▀         ▀  ▀  ▀         ▀  ▀       ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀ 
                                                                              


`.yellow.bold,
    description: "    Metrics Advisor demo app.\n".red.bold,
    fetchingData: (data) => `    Fetching ${data}...`.yellow,
  },
  colorScheme: {
    // Main
    border: "cyan",
    tableText: "light-blue",
    tableHeader: "red",
    background: "#54757c",

    // Modals
    textFieldBorderFocused: "green",
    textFieldBorderUnfocused: "#f0f0f0",
    confirmLight: "light-blue",
    confirmDark: "blue",
    cancelLight: "light-red",
    cancelDark: "red",
  },
  filePaths: {
    configPath: "./config.json",
    dataFeedDataPath: "./datafeed.json",
  },

  baseConfig: {
    lastRefreshed: 0,
  },
};
