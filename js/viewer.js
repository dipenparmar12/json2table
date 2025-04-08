// State management for panel visibility and sizes
const state = {
  isJsonVisible: true,
  isTableVisible: true,
  isTreeVisible: true,
  jsonPanelSize: 0,
  treePanelSize: 0,
  xxaPanelSize: 0,
};

// Initialize the application when document is ready
$(function () {
  initializePanels();
  initializeEventListeners();
});

function initializePanels() {
  // Initialize split panels
  $("#all_panels").split({
    orientation: "vertical",
    limit: 0,
    position: "33%",
  });

  $("#xxa").split({
    orientation: "vertical",
    limit: 0,
    position: "50%",
  });

  // Store initial panel sizes
  state.treePanelSize = $("#tree_pnl").width();
  state.jsonPanelSize = $("#json_pnl").width();
  state.xxaPanelSize = $("#xxa").width();

  // Set up panel drag handlers
  setupPanelDragHandlers();
}

function initializeEventListeners() {
  // View toggle handlers
  $("#jsonViewMenu").click(() => toggleView("json"));
  $("#tableViewMenu").click(() => toggleView("table"));
  $("#treeViewMenu").click(() => toggleView("tree"));

  // Button click handlers
  $("#load_json_btn").click(processJson);
  $("#load_url_btn").click(() => $("#inputURLModal").modal("show"));
  $("#exec_loadBtn").click(() => loadFromUrl($("#urlInput").val()));
}

function toggleView(viewType) {
  const views = {
    json: "isJsonVisible",
    table: "isTableVisible",
    tree: "isTreeVisible",
  };

  // Only toggle if at least one other view is visible
  const otherViewsVisible = Object.keys(views)
    .filter((v) => v !== viewType)
    .some((v) => state[views[v]]);

  if (otherViewsVisible) {
    $(`#${viewType}Li`).toggleClass("active");
    state[views[viewType]] = !state[views[viewType]];
    updatePanelPositions();
  }
}

function updatePanelPositions() {
  const allPanels = $("#all_panels");
  const xxa = $("#xxa");

  if (state.isJsonVisible) {
    allPanels.split().position(allPanels.width() - state.xxaPanelSize - 2);

    if (state.isTableVisible && state.isTreeVisible) {
      xxa.split().position(state.xxaPanelSize - state.treePanelSize - 2);
    } else if (!state.isTableVisible && state.isTreeVisible) {
      xxa.split().position(0);
    } else if (state.isTableVisible && !state.isTreeVisible) {
      xxa.split().position(state.xxaPanelSize);
    }
  } else {
    allPanels.split().position(0);

    if (state.isTableVisible && state.isTreeVisible) {
      xxa.split().position(state.xxaPanelSize - state.treePanelSize - 2);
    }
  }
}

// JSON Processing Functions
function processJson() {
  const jsonData = getJsonData();
  $("#inner_tbl").html(buildTable(jsonData));
  showTree(jsonData);
}

function getJsonData() {
  try {
    const jsonStr = $("#json_vl").val();
    const parsed = JSON.parse(jsonStr);
    $("#json_vl").val(JSON.stringify(parsed, null, 2));
    return parsed;
  } catch (error) {
    showError(error.message);
    return {};
  }
}

// Table Building Functions
function buildTable(data) {
  if (Array.isArray(data)) {
    return buildArrayTable(data);
  }

  const table = document.createElement("table");

  for (const [key, value] of Object.entries(data)) {
    const row = table.insertRow();

    if (typeof value === "object") {
      const cell = row.insertCell();
      cell.colSpan = 2;
      cell.innerHTML = `
        <div class="td_head">${encodeText(key)}</div>
        <table style="width:100%">
          ${$(
            Array.isArray(value) ? buildArrayTable(value) : buildTable(value)
          ).html()}
        </table>
      `;
    } else {
      const keyCell = row.insertCell();
      keyCell.innerHTML = `<div class="td_head">${encodeText(key)}</div>`;

      const valueCell = row.insertCell();
      valueCell.innerHTML = `<div class="td_row_even">${encodeText(
        value
      )}</div>`;
    }
  }

  return table;
}

// Helper Functions
function encodeText(text) {
  return $("<div/>").text(text).html();
}

function showError(message) {
  $("#error_msg").text(message);
  $("#errorModal").modal("show");
}

// Load JSON from URL
function loadFromUrl(url) {
  if (!url.startsWith("http")) {
    url = "http://" + url;
  }

  $("#json_vl").val("Loading...");
  $("#inner_tree, #inner_tbl").html("");

  $.ajax({
    type: "GET",
    url: "http://json2table-env-ayji8pibkt.elasticbeanstalk.com/getjson",
    data: {
      callback: "call",
      url: encodeURIComponent(url),
    },
    contentType: "application/json",
    dataType: "jsonp",
    success: (data) => {
      $("#json_vl").val(JSON.stringify(data, null, 2));
      processJson();
    },
    error: () => {
      $("#json_vl").val("");
      showError(`Not a valid JSON from ${url}`);
    },
  });
}
