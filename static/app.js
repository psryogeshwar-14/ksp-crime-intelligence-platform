// KSP Crime Database Platform - Advanced Core Frontend Application Script

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "/server/ksp_api";

  // --- Global Application State ---
  let appState = {
    userRole: "Investigator",
    userName: "Inspector Kumar",
    lang: "EN",
    voiceOutput: true,
    activeTab: "sectionDashboard",
    crimes: [],
    suspects: [],
    networkData: { nodes: [], links: [] },
    upiTrails: [],
    interstateAlerts: [],
    socioEconomic: {},
    auditLogs: [],
    selectedFir: null,
    selectedSuspect: null
  };

  // --- HTML Elements Registry ---
  const el = {
    loginOverlay: document.getElementById("loginOverlay"),
    btnLogin: document.getElementById("btnLogin"),
    loginUser: document.getElementById("loginUser"),
    loginPass: document.getElementById("loginPass"),
    loginRole: document.getElementById("loginRole"),
    loginError: document.getElementById("loginError"),
    
    profileName: document.getElementById("profileName"),
    profileRole: document.getElementById("profileRole"),
    avatarName: document.getElementById("avatarName"),
    btnLogout: document.getElementById("btnLogout"),
    
    pageTitle: document.getElementById("pageTitle"),
    btnPDFExport: document.getElementById("btnPDFExport"),
    btnThemeToggle: document.getElementById("btnThemeToggle"),
    themeIcon: document.getElementById("themeIcon"),
    btnVoiceToggle: document.getElementById("btnVoiceToggle"),
    voiceIcon: document.getElementById("voiceIcon"),
    
    btnLangEn: document.getElementById("btnLangEn"),
    btnLangKn: document.getElementById("btnLangKn"),
    
    navItems: document.querySelectorAll(".nav-item"),
    viewSections: document.querySelectorAll(".view-section"),
    
    // KPI elements
    kpiTotalFirs: document.getElementById("kpiTotalFirs"),
    kpiSolvedRate: document.getElementById("kpiSolvedRate"),
    kpiSuspects: document.getElementById("kpiSuspects"),
    kpiInterstateAlerts: document.getElementById("kpiInterstateAlerts"),
    
    // Tables & Filters
    filterDistrict: document.getElementById("filterDistrict"),
    filterType: document.getElementById("filterType"),
    tableCrimesBody: document.getElementById("tableCrimesBody"),
    tableAuditLogsBody: document.getElementById("tableAuditLogsBody"),
    tableUpiTrailsBody: document.getElementById("tableUpiTrailsBody"),
    
    // Chat components
    chatForm: document.getElementById("chatForm"),
    chatInput: document.getElementById("chatInput"),
    chatHistory: document.getElementById("chatHistory"),
    suggestionsRow: document.getElementById("suggestionsRow"),
    btnMicInput: document.getElementById("btnMicInput"),
    
    // Explainable AI Audit
    xaiSqlQuery: document.getElementById("xaiSqlQuery"),
    xaiReasoningLogs: document.getElementById("xaiReasoningLogs"),
    
    // Map components
    mapFilterDistrict: document.getElementById("mapFilterDistrict"),
    mapFilterType: document.getElementById("mapFilterType"),
    mapDensityToggle: document.getElementById("mapDensityToggle"),
    mapDistrictMetrics: document.getElementById("mapDistrictMetrics"),
    
    // Network inspect panel
    networkEmptyState: document.getElementById("networkEmptyState"),
    networkNodeInfo: document.getElementById("networkNodeInfo"),
    networkName: document.getElementById("networkName"),
    networkAge: document.getElementById("networkAge"),
    networkCrime: document.getElementById("networkCrime"),
    networkStatus: document.getElementById("networkStatus"),
    networkAssets: document.getElementById("networkAssets"),
    networkNodeBadge: document.getElementById("networkNodeBadge"),
    networkAvatar: document.getElementById("networkAvatar"),
    networkAssociationsList: document.getElementById("networkAssociationsList"),
    
    // MO Matcher & Decision
    moQueryInput: document.getElementById("moQueryInput"),
    btnMatchMo: document.getElementById("btnMatchMo"),
    moResultsCard: document.getElementById("moResultsCard"),
    moMatchesList: document.getElementById("moMatchesList"),
    
    // Dossiers Detail Overlays
    firOverlay: document.getElementById("firOverlay"),
    suspectOverlay: document.getElementById("suspectOverlay"),
    btnCloseFirOverlay: document.getElementById("btnCloseFirOverlay"),
    btnCloseSuspectOverlay: document.getElementById("btnCloseSuspectOverlay"),
    firOverlayBody: document.getElementById("firOverlayBody"),
    suspectOverlayBody: document.getElementById("suspectOverlayBody")
  };

  // --- Chart Object Instances ---
  let charts = {
    crimeTrends: null,
    crimeCategories: null,
    network: null,
    predictiveHeat: null,
    upiNetwork: null,
    socioCorrelation: null
  };

  // --- Leaflet Map Instance ---
  let leafletMap = null;
  let mapLayers = {
    markersGroup: null,
    heatCirclesGroup: null
  };

  // --- Web Speech API Integrations ---
  let speechRecognition = null;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRec();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    
    speechRecognition.onstart = () => {
      el.btnMicInput.classList.add("btn-danger");
      el.chatInput.placeholder = "Listening... Speak now";
    };
    
    speechRecognition.onerror = (event) => {
      console.error("Speech recognition error", event);
      stopDictation();
    };
    
    speechRecognition.onend = () => {
      stopDictation();
    };
    
    speechRecognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      el.chatInput.value = resultText;
      el.chatInput.focus();
    };
  }

  function stopDictation() {
    el.btnMicInput.classList.remove("btn-danger");
    el.chatInput.placeholder = "Query crime database or suspect profiles...";
  }

  function speakText(text) {
    if (!appState.voiceOutput) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = appState.lang === "KN" ? "kn-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  }

  // --- Initial Data Fetching ---
  async function fetchAllData() {
    try {
      const resCrimes = await fetch(API_BASE + "/api/crimes?limit=200");
      appState.crimes = await resCrimes.json();
      
      const resSuspects = await fetch(API_BASE + "/api/suspects");
      appState.suspects = await resSuspects.json();
      
      const resNet = await fetch(API_BASE + "/api/network");
      appState.networkData = await resNet.json();
      
      const resUpi = await fetch(API_BASE + "/api/upi-trails");
      appState.upiTrails = await resUpi.json();
      
      const resAlerts = await fetch(API_BASE + "/api/interstate-alerts");
      appState.interstateAlerts = await resAlerts.json();
      
      const resSocio = await fetch(API_BASE + "/api/socio-economic");
      appState.socioEconomic = await resSocio.json();
      
      await refreshAuditLogs();
      
      renderAllComponents();
      
    } catch (e) {
      console.error("Failed to load application dataset", e);
    }
  }

  async function refreshAuditLogs() {
    const resLogs = await fetch(API_BASE + "/api/audit-logs");
    appState.auditLogs = await resLogs.json();
    renderAuditLogsTable();
  }

  // --- Component Renderings ---
  function renderAllComponents() {
    renderKPIs();
    renderCrimesTable();
    renderAuditLogsTable();
    renderUpiTrailsTable();
    initDashboardCharts();
    initLeafletMap();
    initNetworkChart();
    initPredictiveChart();
    initChatInterface();
    initUpiNetworkChart();
    initSocioCorrelationChart();
  }

  function renderKPIs() {
    el.kpiTotalFirs.textContent = appState.crimes.length;
    el.kpiSolvedRate.textContent = ((appState.crimes.filter(c => c.status === "Solved").length / appState.crimes.length) * 100).toFixed(1) + "%";
    el.kpiSuspects.textContent = appState.suspects.length;
    el.kpiInterstateAlerts.textContent = appState.interstateAlerts.length;
  }

  function renderCrimesTable() {
    const districtFilter = el.filterDistrict.value;
    const typeFilter = el.filterType.value;
    
    let filtered = appState.crimes;
    if (districtFilter) {
      filtered = filtered.filter(c => c.district === districtFilter);
    }
    if (typeFilter) {
      filtered = filtered.filter(c => c.crime_type === typeFilter);
    }
    
    el.tableCrimesBody.innerHTML = "";
    
    filtered.slice(0, 30).forEach(c => {
      const row = document.createElement("tr");
      
      let sevClass = "low";
      if (c.severity === "Medium") sevClass = "medium";
      else if (c.severity === "High") sevClass = "high";
      
      let statusStyle = "background-color: var(--border-color); color: var(--text-secondary);";
      if (c.status === "Solved") {
        statusStyle = "background-color: var(--success-bg); color: var(--success-color); border: 1px solid var(--success-border);";
      } else if (c.status === "Under Investigation") {
        statusStyle = "background-color: var(--warning-bg); color: var(--warning-color); border: 1px solid var(--warning-border);";
      }
      
      row.innerHTML = `
        <td style="font-weight: 700; color: var(--accent-color);">${c.fir_no}</td>
        <td>${c.date}</td>
        <td>${c.district}</td>
        <td>${c.police_station}</td>
        <td>${c.crime_type}</td>
        <td>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <div class="sparkline-track">
              <div class="sparkline-fill ${sevClass}" style="width: ${c.severity === 'High' ? 100 : c.severity === 'Medium' ? 60 : 30}%"></div>
            </div>
            <span style="font-size: 0.775rem; font-weight: 600;">${c.severity}</span>
          </div>
        </td>
        <td>
          <span class="badge" style="${statusStyle}">${c.status}</span>
        </td>
      `;
      
      row.addEventListener("click", () => {
        openFirDossier(c);
      });
      
      el.tableCrimesBody.appendChild(row);
    });
  }

  function renderUpiTrailsTable() {
    el.tableUpiTrailsBody.innerHTML = "";
    appState.upiTrails.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-weight: 700; color: var(--accent-color);">${t.tx_id}</td>
        <td>${t.date}</td>
        <td style="font-weight: bold; color: var(--text-primary);">₹${t.amount.toLocaleString()}</td>
        <td>${t.sender}</td>
        <td>${t.receiver}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${t.bank}</td>
        <td><span class="badge" style="background-color: var(--border-color); color: var(--text-primary);">${t.type}</span></td>
        <td><span class="badge ${t.risk.includes('Critical') || t.risk.includes('High') ? 'high' : 'medium'}">${t.risk}</span></td>
      `;
      el.tableUpiTrailsBody.appendChild(tr);
    });
  }

  function renderAuditLogsTable() {
    el.tableAuditLogsBody.innerHTML = "";
    appState.auditLogs.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(l.timestamp).toLocaleTimeString()}</td>
        <td><span class="badge" style="background-color: var(--border-color); color: var(--text-primary);">${l.user}</span></td>
        <td style="font-weight: 600;">${l.action}</td>
        <td style="font-size: 0.825rem; white-space: normal; word-break: break-word;">${l.details}</td>
        <td><code style="font-size: 0.75rem; background-color: var(--bg-color); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color);">${l.sql_query}</code></td>
      `;
      el.tableAuditLogsBody.appendChild(tr);
    });
  }

  // --- ECharts Visualizations Setup ---

  function initDashboardCharts() {
    const trendContainer = document.getElementById("chartCrimeTrends");
    if (!trendContainer) return;
    
    if (charts.crimeTrends) charts.crimeTrends.dispose();
    charts.crimeTrends = echarts.init(trendContainer);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const cyberData = Array(12).fill(0).map(() => Math.floor(Math.random() * 8) + 4);
    const theftData = Array(12).fill(0).map(() => Math.floor(Math.random() * 12) + 5);
    const assaultData = Array(12).fill(0).map(() => Math.floor(Math.random() * 6) + 2);
    
    const isDark = document.documentElement.classList.contains("dark");
    const labelColor = isDark ? "#a1a1aa" : "#475569";
    const gridBorder = isDark ? "#1e1e24" : "#e2e8f0";

    charts.crimeTrends.setOption({
      color: ["#3b82f6", "#10b981", "#ef4444"],
      textStyle: { fontFamily: "DM Sans, sans-serif" },
      tooltip: { 
        trigger: "axis",
        backgroundColor: isDark ? "#0c0c0f" : "#ffffff",
        borderColor: gridBorder,
        textStyle: { color: isDark ? "#fafafa" : "#0f172a" }
      },
      legend: {
        data: ["Cybercrime", "Theft", "Assault"],
        textStyle: { color: labelColor },
        bottom: 0
      },
      grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true, borderColor: gridBorder },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: months,
        axisLabel: { color: labelColor },
        axisLine: { lineStyle: { color: gridBorder } }
      },
      yAxis: {
        type: "value",
        axisLabel: { color: labelColor },
        splitLine: { lineStyle: { color: gridBorder } }
      },
      series: [
        { name: "Cybercrime", type: "line", smooth: true, data: cyberData },
        { name: "Theft", type: "line", smooth: true, data: theftData },
        { name: "Assault", type: "line", smooth: true, data: assaultData }
      ]
    });

    const catContainer = document.getElementById("chartCrimeCategories");
    if (!catContainer) return;
    
    if (charts.crimeCategories) charts.crimeCategories.dispose();
    charts.crimeCategories = echarts.init(catContainer);
    
    const crimeCounts = {};
    appState.crimes.forEach(c => {
      crimeCounts[c.crime_type] = (crimeCounts[c.crime_type] || 0) + 1;
    });
    
    const pieData = Object.keys(crimeCounts).map(k => ({ value: crimeCounts[k], name: k }));

    charts.crimeCategories.setOption({
      color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"],
      textStyle: { fontFamily: "DM Sans, sans-serif" },
      tooltip: { 
        trigger: "item",
        backgroundColor: isDark ? "#0c0c0f" : "#ffffff",
        borderColor: gridBorder,
        textStyle: { color: isDark ? "#fafafa" : "#0f172a" }
      },
      series: [
        {
          name: "Crime Category Ratio",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: isDark ? "#0c0c0f" : "#ffffff",
            borderWidth: 2
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold",
              formatter: "{b}\n{d}%"
            }
          },
          labelLine: { show: false },
          data: pieData
        }
      ]
    });
  }

  // --- Socio-Economic Correlation Bar Chart (Future India) ---
  function initSocioCorrelationChart() {
    const container = document.getElementById("chartSocioCorrelation");
    if (!container) return;
    
    if (charts.socioCorrelation) charts.socioCorrelation.dispose();
    charts.socioCorrelation = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains("dark");
    const labelColor = isDark ? "#a1a1aa" : "#475569";
    const gridBorder = isDark ? "#1e1e24" : "#e2e8f0";
    
    const districts = Object.keys(appState.socioEconomic);
    const literacyData = districts.map(d => appState.socioEconomic[d].literacy);
    const unemploymentData = districts.map(d => appState.socioEconomic[d].unemployment * 5); // Scaled for comparison visual
    
    charts.socioCorrelation.setOption({
      color: ["#3b82f6", "#f59e0b"],
      textStyle: { fontFamily: "DM Sans, sans-serif" },
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "#0c0c0f" : "#ffffff",
        borderColor: gridBorder,
        textStyle: { color: isDark ? "#fafafa" : "#0f172a" }
      },
      legend: {
        data: ["Literacy Rate (%)", "Unemployment Index (x5)"],
        textStyle: { color: labelColor },
        bottom: 0
      },
      grid: { left: "3%", right: "4%", bottom: "12%", containLabel: true, borderColor: gridBorder },
      xAxis: {
        type: "category",
        data: districts,
        axisLabel: { color: labelColor },
        axisLine: { lineStyle: { color: gridBorder } }
      },
      yAxis: {
        type: "value",
        max: 100,
        axisLabel: { color: labelColor },
        splitLine: { lineStyle: { color: gridBorder } }
      },
      series: [
        { name: "Literacy Rate (%)", type: "bar", barGap: "10%", data: literacyData },
        { name: "Unemployment Index (x5)", type: "bar", data: unemploymentData }
      ]
    });
    
    // Render side description details dynamically
    const descPanel = document.getElementById("socioDistrictDescPanel");
    descPanel.innerHTML = `<h4>District Crime Drivers</h4>`;
    districts.forEach(d => {
      const item = document.createElement("div");
      item.style.backgroundColor = "var(--bg-color)";
      item.style.padding = "0.75rem";
      item.style.borderRadius = "8px";
      item.style.border = "1px solid var(--border-color)";
      item.style.fontSize = "0.8rem";
      item.innerHTML = `
        <strong>${d}</strong>
        <p style="color: var(--text-secondary); margin-top: 0.25rem;">${appState.socioEconomic[d].description}</p>
      `;
      descPanel.appendChild(item);
    });
  }

  // --- Force-Directed Connection Network Graph ---
  function initNetworkChart() {
    const container = document.getElementById("chartNetwork");
    if (!container) return;
    
    if (charts.network) charts.network.dispose();
    charts.network = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains("dark");
    const gridBorder = isDark ? "#1e1e24" : "#e2e8f0";
    
    const nodes = appState.networkData.nodes.map(n => {
      let color = "#10b981";
      if (n.risk > 80) color = "#ef4444";
      else if (n.risk > 60) color = "#f59e0b";
      
      return {
        id: n.id,
        name: n.name,
        symbolSize: n.risk / 2.5 + 15,
        itemStyle: { color: color },
        label: { show: true, position: "right", color: isDark ? "#fafafa" : "#0f172a" },
        value: n
      };
    });
    
    const links = appState.networkData.links.map(l => ({
      source: l.source,
      target: l.target,
      label: { show: true, formatter: l.type, fontSize: 9 },
      lineStyle: { width: 2, curveness: 0.1 }
    }));

    charts.network.setOption({
      tooltip: {
        backgroundColor: isDark ? "#0c0c0f" : "#ffffff",
        borderColor: gridBorder,
        textStyle: { color: isDark ? "#fafafa" : "#0f172a" },
        formatter: (params) => {
          if (params.dataType === "node") {
            const data = params.data.value;
            return `<strong>${data.name}</strong><br/>Risk Score: ${data.risk}/100<br/>Primary Crime: ${data.crime}<br/>Status: ${data.status}`;
          }
          return `Relationship: ${params.data.label.formatter}`;
        }
      },
      series: [
        {
          type: "graph",
          layout: "force",
          animation: true,
          draggable: true,
          data: nodes,
          links: links,
          roam: true,
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 8,
          force: { repulsion: 300, edgeLength: 150, layoutAnimation: true },
          lineStyle: { color: isDark ? "#52525b" : "#94a3b8", opacity: 0.8 }
        }
      ]
    });
    
    charts.network.on("click", (params) => {
      if (params.dataType === "node") {
        inspectNetworkNode(params.data.value);
      }
    });
  }

  function inspectNetworkNode(suspect) {
    el.networkEmptyState.style.display = "none";
    el.networkNodeInfo.style.display = "flex";
    
    el.networkName.textContent = suspect.name;
    el.networkAge.textContent = suspect.age || "34";
    el.networkCrime.textContent = suspect.crime;
    el.networkStatus.textContent = suspect.status;
    el.networkAssets.textContent = suspect.status === "Active" ? "KA-01-MJ-2041" : "N/A";
    el.networkNodeBadge.textContent = `Risk: ${suspect.risk}`;
    el.networkAvatar.textContent = suspect.name[0];
    
    const relatives = appState.networkData.links.filter(l => l.source === suspect.id || l.target === suspect.id);
    el.networkAssociationsList.innerHTML = "";
    
    if (relatives.length === 0) {
      el.networkAssociationsList.innerHTML = `<div style="font-size: 0.775rem; color: var(--text-muted);">No direct associate mappings found.</div>`;
    } else {
      relatives.forEach(l => {
        const peerId = l.source === suspect.id ? l.target : l.source;
        const peer = appState.networkData.nodes.find(n => n.id === peerId) || { name: peerId };
        
        const item = document.createElement("div");
        item.style.backgroundColor = "var(--bg-color)";
        item.style.padding = "0.75rem";
        item.style.borderRadius = "8px";
        item.style.border = "1px solid var(--border-color)";
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.8rem; margin-bottom: 0.25rem;">
            <span>${peer.name}</span>
            <span style="color: var(--accent-color);">${l.type}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${l.details}</div>
        `;
        el.networkAssociationsList.appendChild(item);
      });
    }
  }

  // --- ECharts UPI Money Trail Network Graph ---
  function initUpiNetworkChart() {
    const container = document.getElementById("chartUpiNetwork");
    if (!container) return;
    
    if (charts.upiNetwork) charts.upiNetwork.dispose();
    charts.upiNetwork = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains("dark");
    const gridBorder = isDark ? "#1e1e24" : "#e2e8f0";
    
    const nodes = [
      { id: "S101", name: "Ravi Kumar (Suspect)", symbolSize: 22, itemStyle: { color: "#ef4444" } },
      { id: "S103", name: "Vikram Singh (Suspect)", symbolSize: 22, itemStyle: { color: "#ef4444" } },
      { id: "S102", name: "Anwar Pasha (Suspect)", symbolSize: 22, itemStyle: { color: "#f59e0b" } },
      { id: "S105", name: "Suresh Gowda (Suspect)", symbolSize: 22, itemStyle: { color: "#ef4444" } },
      { id: "M993", name: "Mule Account (HDFC-993)", symbolSize: 18, itemStyle: { color: "#3b82f6" } },
      { id: "M104", name: "Mule Account (PNB-104)", symbolSize: 18, itemStyle: { color: "#3b82f6" } }
    ];
    
    const links = [
      { source: "S101", target: "S103", label: { show: true, formatter: "₹4,50,000" } },
      { source: "S103", target: "M993", label: { show: true, formatter: "₹1,25,000" } },
      { source: "S105", target: "S101", label: { show: true, formatter: "₹80,000" } },
      { source: "S102", target: "M104", label: { show: true, formatter: "₹3,20,000" } }
    ];

    charts.upiNetwork.setOption({
      tooltip: {
        backgroundColor: isDark ? "#0c0c0f" : "#ffffff",
        borderColor: gridBorder,
        textStyle: { color: isDark ? "#fafafa" : "#0f172a" }
      },
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          roam: true,
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 8,
          force: { repulsion: 250, edgeLength: 120 },
          lineStyle: { color: isDark ? "#52525b" : "#94a3b8", width: 2 }
        }
      ]
    });
  }

  // --- Geospatial Hotspot Leaflet Map ---
  function initLeafletMap() {
    const container = document.getElementById("mapCrimeHotspots");
    if (!container) return;
    
    if (leafletMap) {
      leafletMap.remove();
    }
    
    leafletMap = L.map(container).setView([12.9716, 77.5946], 7);
    
    const isDark = document.documentElement.classList.contains("dark");
    const tileUrl = isDark 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(leafletMap);
    
    mapLayers.markersGroup = L.layerGroup().addTo(leafletMap);
    mapLayers.heatCirclesGroup = L.layerGroup().addTo(leafletMap);
    
    // Render interstate border station alerts as custom icons on the map
    renderMapData();
    renderInterstateBorderAlertNodes();
  }

  function renderInterstateBorderAlertNodes() {
    if (!leafletMap) return;
    
    // Border coordinates sample
    const borders = [
      { name: "Hosur Checkpoint (TN Border)", coords: [12.7409, 77.8253], text: "Tamil Nadu Alert broadcast active." },
      { name: "Kasaragod Checkpoint (KL Border)", coords: [12.5100, 74.9800], text: "Kerala Drugs Squad checkpoint active." },
      { name: "Nippani Checkpoint (MH Border)", coords: [16.4000, 74.3800], text: "Maharashtra Crime Branch alerting border crossings." }
    ];
    
    const borderIcon = L.divIcon({
      className: "border-checkpoint-marker",
      html: `<div style="background-color: var(--error-color); color: white; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px red;"></div>`,
      iconSize: [14, 14]
    });
    
    borders.forEach(b => {
      L.marker(b.coords, { icon: borderIcon })
        .bindPopup(`<strong>${b.name}</strong><br/>${b.text}`)
        .addTo(leafletMap);
    });
  }

  function renderMapData() {
    if (!leafletMap) return;
    
    mapLayers.markersGroup.clearLayers();
    mapLayers.heatCirclesGroup.clearLayers();
    
    const districtFilter = el.mapFilterDistrict.value;
    const typeFilter = el.mapFilterType.value;
    const viewMode = el.mapDensityToggle.value;
    
    let filtered = appState.crimes;
    if (districtFilter) {
      filtered = filtered.filter(c => c.district === districtFilter);
    }
    if (typeFilter) {
      filtered = filtered.filter(c => c.crime_type === typeFilter);
    }
    
    updateMapMetrics(filtered);
    
    filtered.forEach(c => {
      if (viewMode === "markers") {
        const marker = L.marker([c.lat, c.lng]);
        marker.bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif;">
            <strong style="color: var(--accent-color); font-size: 0.9rem;">${c.fir_no}</strong><br/>
            <strong>Category:</strong> ${c.crime_type}<br/>
            <strong>Police Station:</strong> ${c.police_station}<br/>
            <strong>Severity:</strong> ${c.severity}<br/>
            <strong>Status:</strong> ${c.status}<br/>
            <button class="btn btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-top: 0.5rem; width: 100%;" onclick="openFirDossierById('${c.fir_no}')">Inspect Case File</button>
          </div>
        `);
        mapLayers.markersGroup.addLayer(marker);
      } else {
        let color = "#10b981";
        if (c.severity === "High") color = "#ef4444";
        else if (c.severity === "Medium") color = "#f59e0b";
        
        const circle = L.circle([c.lat, c.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.35,
          radius: 1200
        });
        circle.bindPopup(`<strong>Density Hotspot Peak</strong><br/>Category: ${c.crime_type}<br/>Station: ${c.police_station}`);
        mapLayers.heatCirclesGroup.addLayer(circle);
      }
    });
    
    if (filtered.length > 0 && districtFilter) {
      const group = viewMode === "markers" ? mapLayers.markersGroup : mapLayers.heatCirclesGroup;
      const bounds = L.featureGroup(group.getLayers()).getBounds();
      leafletMap.fitBounds(bounds);
    }
  }

  function updateMapMetrics(filteredData) {
    const counts = {};
    filteredData.forEach(c => {
      counts[c.district] = (counts[c.district] || 0) + 1;
    });
    
    el.mapDistrictMetrics.innerHTML = "";
    Object.keys(counts).sort((a,b) => counts[b] - counts[a]).forEach(d => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.borderBottom = "1px solid var(--border-color)";
      item.style.paddingBottom = "0.35rem";
      item.innerHTML = `
        <span style="font-weight: 500;">${d}</span>
        <strong style="color: var(--accent-color);">${counts[d]} Cases</strong>
      `;
      el.mapDistrictMetrics.appendChild(item);
    });
  }

  // --- ECharts Predictive Risk Chart ---
  function initPredictiveChart() {
    const container = document.getElementById("chartPredictiveHeat");
    if (!container) return;
    
    if (charts.predictiveHeat) charts.predictiveHeat.dispose();
    charts.predictiveHeat = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains("dark");
    const labelColor = isDark ? "#a1a1aa" : "#475569";
    const gridBorder = isDark ? "#1e1e24" : "#e2e8f0";
    
    const districts = ["Bengaluru City", "Mysuru", "Hubli-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi"];
    const riskScores = [92, 78, 65, 54, 48, 42];

    charts.predictiveHeat.setOption({
      color: ["#ef4444"],
      textStyle: { fontFamily: "DM Sans, sans-serif" },
      tooltip: { 
        trigger: "axis",
        backgroundColor: isDark ? "#0c0c0f" : "#ffffff",
        borderColor: gridBorder,
        textStyle: { color: isDark ? "#fafafa" : "#0f172a" },
        formatter: "{b}: Forecasting Risk {c}%"
      },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        data: districts,
        axisLabel: { color: labelColor, rotate: 15 },
        axisLine: { lineStyle: { color: gridBorder } }
      },
      yAxis: {
        type: "value",
        max: 100,
        axisLabel: { color: labelColor },
        splitLine: { lineStyle: { color: gridBorder } }
      },
      series: [
        {
          name: "Spatio-Temporal Risk Metric",
          type: "bar",
          barWidth: "40%",
          data: riskScores,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#ef4444" },
              { offset: 1, color: "#f59e0b" }
            ])
          }
        }
      ]
    });
  }

  // --- Modus Operandi (MO) Search Matcher ---
  el.btnMatchMo.addEventListener("click", async () => {
    const moText = el.moQueryInput.value;
    if (!moText.trim()) return;
    
    try {
      const response = await fetch(API_BASE + "/api/match-mo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mo_text: moText })
      });
      
      const data = await response.json();
      
      // Render results
      el.moResultsCard.style.display = "block";
      el.moMatchesList.innerHTML = "";
      
      if (data.matches.length === 0) {
        el.moMatchesList.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">No suspicious profiles match this exact MO technique.</div>`;
      } else {
        data.matches.forEach(m => {
          const item = document.createElement("div");
          const isHabitual = m.habitual_offender || m.risk_score >= 80;
          item.style.backgroundColor = "var(--bg-color)";
          item.style.padding = "1rem";
          item.style.borderRadius = "8px";
          item.style.border = isHabitual
            ? "1px solid var(--error-color)"
            : "1px solid var(--border-color)";
          if (isHabitual) {
            item.style.background = "linear-gradient(135deg, rgba(244,63,94,0.05) 0%, var(--bg-color) 60%)";
          }

          const habitualBadge = isHabitual
            ? `<span style="background:rgba(244,63,94,0.15); color:var(--error-color); border:1px solid rgba(244,63,94,0.3);
                            font-size:0.65rem; font-weight:800; padding:0.15rem 0.5rem; border-radius:9999px;
                            letter-spacing:0.05em; margin-left:0.5rem;">⚠ HABITUAL OFFENDER</span>`
            : "";

          const victimBadge = m.victim_count > 0
            ? `<span style="background:rgba(251,191,36,0.12); color:var(--warning-color); border:1px solid rgba(251,191,36,0.3);
                            font-size:0.65rem; font-weight:700; padding:0.15rem 0.5rem; border-radius:9999px; margin-left:0.5rem;">
                🫂 ${m.victim_count} Victim${m.victim_count > 1 ? "s" : ""} Linked</span>`
            : "";

          const victimNames = m.linked_victims && m.linked_victims.length > 0
            ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.35rem;">
                <strong>Victims:</strong> ${m.linked_victims.join(", ")}
               </div>`
            : "";

          item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap:wrap; gap:0.35rem;">
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:0.3rem;">
                <strong style="color: var(--accent-color); font-size: 0.9rem;">${m.name}</strong>
                ${habitualBadge}
                ${victimBadge}
              </div>
              <span class="badge high">Risk Index: ${m.risk_score}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
              <strong>Suspect Typical MO:</strong> ${m.mo || 'N/A'}
            </div>
            ${victimNames}
            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.775rem; margin-top:0.5rem;" onclick="openSuspectDossierById('${m.id}')">Inspect Dossier</button>
          `;
          el.moMatchesList.appendChild(item);
        });
        
        // Add recommendations alert
        const recoAlert = document.createElement("div");
        recoAlert.style.backgroundColor = "var(--warning-bg)";
        recoAlert.style.color = "var(--warning-color)";
        recoAlert.style.border = "1px solid var(--warning-border)";
        recoAlert.style.padding = "0.85rem";
        recoAlert.style.borderRadius = "8px";
        recoAlert.style.fontSize = "0.8rem";
        recoAlert.innerHTML = `
          <strong>Proactive Investigation Leads:</strong>
          <p style="margin-top: 0.25rem; color: var(--text-secondary);">${data.recommendations}</p>
        `;
        el.moMatchesList.appendChild(recoAlert);
      }
      
      // Store for radar chart feature
      appState._lastMoMatches = data.matches;
      
      // Update Audit Logs
      refreshAuditLogs();
      
    } catch(e) {
      console.error(e);
    }
  });

  // --- Conversational Chat Interface & Local Streaming Animation ---
  function initChatInterface() {
    el.chatHistory.innerHTML = "";
    addChatBubble("model", `Welcome, **${appState.userRole}**! I am the KSP Crime Database Intelligent Assistant. You can query incident stats, check suspect criminal networks, or view predictive warnings directly.\n\nUse toggles above to switch languages. Try clicking standard options below to test.`, "System welcome initialized.");
  }

  function addChatBubble(role, content, thoughts = "", suggestions = []) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    
    const idx = el.chatHistory.children.length;
    
    let thoughtsHtml = "";
    if (role === "model" && thoughts) {
      thoughtsHtml = `
        <div class="thoughts-container">
          <button class="thoughts-toggle" onclick="toggleThoughtBox(${idx})">
            <i data-lucide="brain-circuit" style="width: 14px; height: 14px; color: var(--accent-color);"></i>
            <span>System Reasoning Process Logs</span>
          </button>
          <div class="thoughts-content" id="thought-${idx}" style="display: none;">
            ${thoughts.split('\n').map(t => `<div>› ${t}</div>`).join('')}
          </div>
        </div>
      `;
    }
    
    bubble.innerHTML = `
      <div class="avatar">${role === 'user' ? 'U' : 'AI'}</div>
      <div class="bubble-content">
        ${thoughtsHtml}
        <div class="bubble-text">
          ${formatMarkdown(content)}
        </div>
      </div>
    `;
    
    el.chatHistory.appendChild(bubble);
    lucide.createIcons();
    
    el.chatHistory.scrollTop = el.chatHistory.scrollHeight;
    
    if (role === "model") {
      speakText(content.replace(/[#*`]/g, ""));
    }
  }

  window.toggleThoughtBox = (idx) => {
    const tBox = document.getElementById(`thought-${idx}`);
    if (tBox) {
      tBox.style.display = tBox.style.display === "none" ? "flex" : "none";
    }
  };

  function formatMarkdown(text) {
    let formatted = text
      .replace(/### (.*?)\n/g, "<h3>$1</h3>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\* (.*?)/g, "<li>$1</li>")
      .replace(/\n- (.*?)/g, "<li>$1</li>");
      
    if (formatted.includes("<li>")) {
      formatted = formatted.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
    }
    
    return formatted.replace(/\n/g, "<br/>");
  }

  async function handleSendMessage(messageText) {
    if (!messageText.trim()) return;
    
    addChatBubble("user", messageText);
    el.chatInput.value = "";
    el.chatInput.style.height = "48px";
    
    const loader = document.createElement("div");
    loader.className = "chat-bubble model";
    loader.id = "chatBubbleLoader";
    loader.innerHTML = `
      <div class="avatar">AI</div>
      <div class="bubble-content">
        <div class="bubble-text" style="color: var(--text-muted); italic; display: flex; align-items: center; gap: 0.5rem;">
          <i data-lucide="loader-2" class="animate-spin" style="width: 16px; height: 16px;"></i> Analyzing request...
        </div>
      </div>
    `;
    el.chatHistory.appendChild(loader);
    lucide.createIcons();
    el.chatHistory.scrollTop = el.chatHistory.scrollHeight;
    
    try {
      const response = await fetch(API_BASE + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: [],
          role: appState.userRole
        })
      });
      
      const data = await response.json();
      
      const loaderEl = document.getElementById("chatBubbleLoader");
      if (loaderEl) loaderEl.remove();
      
      el.xaiSqlQuery.textContent = data.sql;
      el.xaiReasoningLogs.innerHTML = data.thoughts.split('\n').map(t => `<div style="margin-bottom: 0.25rem; color: var(--text-secondary);">› ${t}</div>`).join('');
      
      simulateStreamingMessage(data);
      
    } catch (e) {
      console.error(e);
      const loaderEl = document.getElementById("chatBubbleLoader");
      if (loaderEl) loaderEl.remove();
      addChatBubble("model", "⚠️ System network connection error. Could not reach KSP AI server.");
    }
  }

  function simulateStreamingMessage(data) {
    addChatBubble("model", data.content, data.thoughts);
    
    el.suggestionsRow.innerHTML = "";
    data.suggestions.forEach(s => {
      const btn = document.createElement("button");
      btn.className = "suggestion-btn";
      btn.textContent = s;
      btn.addEventListener("click", () => handleSendMessage(s));
      el.suggestionsRow.appendChild(btn);
    });
    
    refreshAuditLogs();
  }

  // --- Case FIR & Suspect dossier detail panels ---
  
  window.openFirDossierById = (firNo) => {
    const fir = appState.crimes.find(c => c.fir_no === firNo);
    if (fir) openFirDossier(fir);
  };

  function openFirDossier(fir) {
    el.firOverlayBody.innerHTML = `
      <div style="background-color: var(--bg-color); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.75rem;">
        <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">FIR ID Number</span>
          <h4 style="font-size: 1.2rem; font-weight: 800; color: var(--accent-color);">${fir.fir_no}</h4>
        </div>
        <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Crime Category</span>
          <p style="font-weight: 600;">${fir.crime_type}</p>
        </div>
        <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Date Reported</span>
          <p>${fir.date}</p>
        </div>
        <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Police Jurisdiction</span>
          <p>${fir.police_station} (${fir.district})</p>
        </div>
      </div>
      
      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Incident Narrative Log</h4>
        <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); background-color: var(--bg-color); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
          ${fir.description}
        </p>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Associated Suspect File</h4>
        <div style="display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-color); padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
          <div>
            <strong style="display: block; font-size: 0.9rem;">${fir.suspect}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${fir.suspect_id ? 'Surveillance Active' : 'No dossiers on file'}</span>
          </div>
          ${fir.suspect_id ? `<button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.775rem;" onclick="openSuspectDossierById('${fir.suspect_id}')">Open Dossier</button>` : ''}
        </div>
      </div>
    `;
    el.firOverlay.classList.add("active");
  }

  window.openSuspectDossierById = (susId) => {
    const s = appState.suspects.find(sp => sp.id === susId);
    if (s) openSuspectDossier(s);
  };

  function openSuspectDossier(s) {
    const relatives = appState.networkData.links.filter(l => l.source === s.id || l.target === s.id);
    const relativesListHtml = relatives.map(l => {
      const peer = l.source === s.id ? l.target : l.source;
      return `<li style="margin-bottom: 0.25rem; font-size: 0.825rem; color: var(--text-secondary);"><strong>${peer}</strong> (${l.type}): ${l.details}</li>`;
    }).join("");

    // Find UPI transaction logs linked
    const upiLogs = appState.upiTrails.filter(t => t.sender.includes(s.id) || t.receiver.includes(s.id));
    const upiLogsHtml = upiLogs.map(t => {
      return `<li style="margin-bottom: 0.25rem; font-size: 0.825rem; color: var(--text-secondary);"><strong>${t.tx_id}</strong>: Transferred ₹${t.amount.toLocaleString()} on ${t.date} (${t.type})</li>`;
    }).join("");

    // Find interstate alerts
    const stateAlerts = appState.interstateAlerts.filter(a => a.suspect_id === s.id);
    const stateAlertsHtml = stateAlerts.map(a => {
      return `<div style="background-color: var(--error-bg); border: 1px solid var(--error-border); color: var(--error-color); padding: 0.5rem; border-radius: 6px; font-size: 0.775rem; margin-top: 0.25rem;">
        <strong>Wanted: ${a.state} (${a.police_unit})</strong><br/>${a.details}
      </div>`;
    }).join("");

    el.suspectOverlayBody.innerHTML = `
      <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem;">
        <div style="background-color: var(--accent-color); color: white; width: 64px; height: 64px; border-radius: 50%; font-size: 1.5rem; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
          ${s.name[0]}
        </div>
        <h4 style="font-size: 1.1rem; font-weight: 800;">${s.name}</h4>
        <span class="badge high" style="margin-top: 0.5rem;">Risk Index: ${s.risk_score}/100</span>
        ${stateAlertsHtml}
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.4rem;">
          <span style="color: var(--text-secondary);">Surveillance Status</span>
          <strong>${s.status}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.4rem;">
          <span style="color: var(--text-secondary);">Primary Offense</span>
          <strong>${s.crime}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.4rem;">
          <span style="color: var(--text-secondary);">Registered Phone</span>
          <strong>${s.phone}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.4rem;">
          <span style="color: var(--text-secondary);">Linked Vehicle</span>
          <strong>${s.vehicle}</strong>
        </div>
      </div>

      <div style="margin-top: 1rem;">
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">UPI Money Trails</h4>
        <ul style="padding-left: 1.25rem;">
          ${upiLogsHtml || '<span style="font-size: 0.8rem; color: var(--text-muted);">No flagged transaction records.</span>'}
        </ul>
      </div>

      <div style="margin-top: 1rem;">
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;">Criminal Associates Links</h4>
        <ul style="padding-left: 1.25rem;">
          ${relativesListHtml || '<span style="font-size: 0.8rem; color: var(--text-muted);">No records found.</span>'}
        </ul>
      </div>
    `;
    el.suspectOverlay.classList.add("active");
  }

  // --- Authentication Access ---
  el.btnLogin.addEventListener("click", async () => {
    const username = el.loginUser.value;
    const password = el.loginPass.value;
    const role = el.loginRole.value;
    
    try {
      const response = await fetch(API_BASE + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });
      
      if (response.ok) {
        const data = await response.json();
        appState.userRole = data.role;
        appState.userName = data.name;
        
        el.loginOverlay.style.display = "none";
        
        el.profileName.textContent = data.name;
        el.profileRole.textContent = data.role;
        el.avatarName.textContent = data.name[0];
        
        applyRoleAccessRestrictions();
        await fetchAllData();
        
      } else {
        const err = await response.json();
        el.loginError.textContent = err.message || "Invalid authentication credentials";
        el.loginError.style.display = "block";
      }
    } catch (e) {
      el.loginError.textContent = "Could not connect to authentication services.";
      el.loginError.style.display = "block";
    }
  });

  function applyRoleAccessRestrictions() {
    // If investigator/policemaker, restrict editing capability, but keep full dashboard read active
  }

  el.btnLogout.addEventListener("click", () => {
    el.loginUser.value = "";
    el.loginPass.value = "";
    el.loginOverlay.style.display = "flex";
    el.loginError.style.display = "none";
  });

  // --- Theme Toggle ---
  el.btnThemeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      el.themeIcon.setAttribute("data-lucide", "moon");
    } else {
      document.documentElement.classList.add("dark");
      el.themeIcon.setAttribute("data-lucide", "sun");
    }
    lucide.createIcons();
    
    setTimeout(() => {
      initDashboardCharts();
      initNetworkChart();
      initPredictiveChart();
      initLeafletMap();
      initUpiNetworkChart();
      initSocioCorrelationChart();
    }, 150);
  });

  el.btnVoiceToggle.addEventListener("click", () => {
    appState.voiceOutput = !appState.voiceOutput;
    if (appState.voiceOutput) {
      el.voiceIcon.setAttribute("data-lucide", "volume-2");
    } else {
      el.voiceIcon.setAttribute("data-lucide", "volume-x");
    }
    lucide.createIcons();
  });

  el.btnLangEn.addEventListener("click", () => {
    appState.lang = "EN";
    el.btnLangEn.classList.add("active");
    el.btnLangKn.classList.remove("active");
    addChatBubble("model", "Language switched to English. How can I assist you today?");
  });

  el.btnLangKn.addEventListener("click", () => {
    appState.lang = "KN";
    el.btnLangKn.classList.add("active");
    el.btnLangEn.classList.remove("active");
    addChatBubble("model", "ಕನ್ನಡ ಭಾಷೆಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?");
  });

  // --- Navigation tabs switching ---
  el.navItems.forEach(item => {
    item.addEventListener("click", () => {
      el.navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const targetSection = item.getAttribute("data-target");
      appState.activeTab = targetSection;
      
      el.viewSections.forEach(sec => {
        sec.style.display = sec.id === targetSection ? "block" : "none";
      });
      
      el.pageTitle.textContent = item.querySelector("span").textContent;
      
      setTimeout(() => {
        if (targetSection === "sectionDashboard") {
          initDashboardCharts();
          initSocioCorrelationChart();
        } else if (targetSection === "sectionMap") {
          initLeafletMap();
        } else if (targetSection === "sectionNetwork") {
          initNetworkChart();
        } else if (targetSection === "sectionPredict") {
          initPredictiveChart();
        } else if (targetSection === "sectionFinancial") {
          initUpiNetworkChart();
        }
      }, 100);
    });
  });

  // --- Filters ---
  el.filterDistrict.addEventListener("change", renderCrimesTable);
  el.filterType.addEventListener("change", renderCrimesTable);
  
  el.mapFilterDistrict.addEventListener("change", renderMapData);
  el.mapFilterType.addEventListener("change", renderMapData);
  el.mapDensityToggle.addEventListener("change", renderMapData);

  // --- Chat Submit ---
  el.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSendMessage(el.chatInput.value);
  });

  el.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(el.chatInput.value);
    }
  });

  el.chatInput.addEventListener("input", () => {
    el.chatInput.style.height = "auto";
    el.chatInput.style.height = Math.min(el.chatInput.scrollHeight, 140) + "px";
  });

  el.btnMicInput.addEventListener("click", () => {
    if (!speechRecognition) {
      alert("Speech Recognition API is not supported in this browser version. Recommend Chrome.");
      return;
    }
    try {
      speechRecognition.start();
    } catch(e) {
      speechRecognition.stop();
    }
  });

  el.btnCloseFirOverlay.addEventListener("click", () => el.firOverlay.classList.remove("active"));
  el.btnCloseSuspectOverlay.addEventListener("click", () => el.suspectOverlay.classList.remove("active"));

  el.btnPDFExport.addEventListener("click", () => {
    window.print();
  });

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #1: LIVE ALERT TICKER
     ═══════════════════════════════════════════════════════════ */
  function initAlertTicker() {
    const tickerData = [
      { color: "red",   text: "CRITICAL — Ravi Kumar (S101) vehicle KA-01-MJ-2041 spotted near Majestic Metro at 14:32 IST" },
      { color: "amber", text: "ALERT — Vikram Singh (S103) last known IP traced to Koramangala cyber café – warrant active" },
      { color: "red",   text: "BORDER ALERT — KA-09-H-4567 flagged at Hosur checkpoint by Tamil Nadu PS" },
      { color: "blue",  text: "UPI FREEZE — HDFC Account 501029482 freeze order submitted to Bengaluru Cyber PS" },
      { color: "amber", text: "MO MATCH — Daytime lock-tamper incidents spike +38% in Indiranagar last 7 days" },
      { color: "red",   text: "DRUG NETWORK — Suresh Gowda (S105) mobile pings Kasaragod district — Kerala alert issued" },
      { color: "blue",  text: "FIR UPDATE — FIR/BEN/2026/0087 Cybercrime – investigation escalated to SP level" },
      { color: "amber", text: "RECIDIVISM WARNING — Manju Gowda (S104) released on bail; movement tracking active" },
    ];

    const el_ticker = document.getElementById("tickerContent");
    if (!el_ticker) return;

    // Duplicate array for seamless loop
    const allItems = [...tickerData, ...tickerData];
    el_ticker.innerHTML = allItems.map(item => `
      <span class="ticker-item">
        <span class="tick-dot ${item.color}"></span>
        ${item.text}
      </span>
    `).join("");
  }

  initAlertTicker();

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #2: ENHANCED WAVEFORM MIC VISUALIZER
     ═══════════════════════════════════════════════════════════ */
  const waveformOverlay = document.getElementById("waveformOverlay");
  const waveformLabel   = document.getElementById("waveformLabel");

  function showWaveform(lang) {
    waveformLabel.textContent = `Listening in ${lang === "KN" ? "ಕನ್ನಡ" : "English"}... speak now`;
    waveformOverlay.classList.add("active");
    el.btnMicInput.classList.add("btn-mic-active");
  }

  function hideWaveform() {
    waveformOverlay.classList.remove("active");
    el.btnMicInput.classList.remove("btn-mic-active");
  }

  // Intercept the existing speech recognition events
  if (typeof speechRecognition !== "undefined" && speechRecognition) {
    const origStart = speechRecognition.onstart;
    const origEnd   = speechRecognition.onend;
    const origError = speechRecognition.onerror;

    speechRecognition.onstart = function(e) {
      showWaveform(appState.lang);
      if (origStart) origStart.call(this, e);
    };
    speechRecognition.onend = function(e) {
      hideWaveform();
      if (origEnd) origEnd.call(this, e);
    };
    speechRecognition.onerror = function(e) {
      hideWaveform();
      if (origError) origError.call(this, e);
    };
  }

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #3: PULSING LEAFLET HOTSPOT MARKERS
     (Replaces plain circle markers with animated pulse icons)
     ═══════════════════════════════════════════════════════════ */
  function createPulseIcon(riskLevel) {
    const cls = riskLevel >= 80 ? "pulse-high" : riskLevel >= 50 ? "pulse-medium" : "pulse-low";
    return L.divIcon({
      className: `leaflet-pulse-icon ${cls}`,
      html: `<div class="pulse-container ${cls}">
               <div class="pulse-ring"></div>
               <div class="pulse-ring delay"></div>
               <div class="pulse-dot"></div>
             </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  // Override the existing renderMap function to use pulse icons for suspects
  const _origRenderMap = window._kspRenderMap;
  // Hook into map initialization: if suspects are already loaded, add pulse markers
  function addSuspectPulseMarkers() {
    if (!window._kspMap || !appState.suspects.length) return;
    appState.suspects.forEach(s => {
      const icon = createPulseIcon(s.risk_score);
      const marker = L.marker([s.lat, s.lng], { icon })
        .addTo(window._kspMap)
        .bindPopup(`<b>${s.name}</b><br>Risk: ${s.risk_score}/100<br>${s.crime}`);
    });
  }

  // Try to add after a delay (map may not be ready yet)
  setTimeout(() => {
    addSuspectPulseMarkers();
  }, 2000);

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #4: SANKEY MONEY LAUNDERING FLOW DIAGRAM
     (Added inside the Financial section on first visit)
     ═══════════════════════════════════════════════════════════ */
  let sankeyChartInstance = null;

  function initSankeyChart() {
    const container = document.getElementById("chartSankey");
    if (!container || sankeyChartInstance) return;

    sankeyChartInstance = echarts.init(container);

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          if (params.dataType === "edge") {
            return `<b>${params.data.source} → ${params.data.target}</b><br/>₹${Number(params.data.value).toLocaleString("en-IN")}`;
          }
          return `<b>${params.name}</b>`;
        }
      },
      series: [{
        type: "sankey",
        layout: "none",
        emphasis: { focus: "adjacency" },
        nodeAlign: "left",
        data: [
          { name: "Victim Account", itemStyle: { color: "#10b981" } },
          { name: "Ravi Kumar (S101)", itemStyle: { color: "#f43f5e" } },
          { name: "Vikram Singh (S103)", itemStyle: { color: "#f43f5e" } },
          { name: "Anwar Pasha (S102)", itemStyle: { color: "#f43f5e" } },
          { name: "Mule Acct HDFC-993", itemStyle: { color: "#fbbf24" } },
          { name: "Mule Acct PNB-104",  itemStyle: { color: "#fbbf24" } },
          { name: "Shell Co. Pvt Ltd",  itemStyle: { color: "#f97316" } },
          { name: "Hawala Cash-out",    itemStyle: { color: "#a855f7" } },
          { name: "Crypto Wallet",      itemStyle: { color: "#6366f1" } },
        ],
        links: [
          { source: "Victim Account",      target: "Ravi Kumar (S101)",   value: 450000 },
          { source: "Victim Account",      target: "Anwar Pasha (S102)",  value: 320000 },
          { source: "Ravi Kumar (S101)",   target: "Vikram Singh (S103)", value: 450000 },
          { source: "Vikram Singh (S103)", target: "Mule Acct HDFC-993",  value: 320000 },
          { source: "Vikram Singh (S103)", target: "Shell Co. Pvt Ltd",   value: 130000 },
          { source: "Anwar Pasha (S102)",  target: "Mule Acct PNB-104",   value: 320000 },
          { source: "Mule Acct HDFC-993",  target: "Hawala Cash-out",     value: 200000 },
          { source: "Mule Acct HDFC-993",  target: "Crypto Wallet",       value: 120000 },
          { source: "Mule Acct PNB-104",   target: "Hawala Cash-out",     value: 200000 },
          { source: "Shell Co. Pvt Ltd",   target: "Hawala Cash-out",     value: 130000 },
        ],
        lineStyle: { color: "gradient", opacity: 0.35 },
        label: {
          color: getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim() || "#fff",
          fontFamily: "DM Sans",
          fontSize: 11,
        }
      }]
    };
    sankeyChartInstance.setOption(option);
    window.addEventListener("resize", () => sankeyChartInstance.resize());
  }

  // Inject Sankey container into the Financial section if it doesn't exist
  function ensureSankeySection() {
    if (document.getElementById("chartSankey")) return;
    const fin = document.getElementById("sectionFinancial");
    if (!fin) return;
    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "2rem";
    div.innerHTML = `
      <div class="card-header">
        <h3 style="font-weight:700;font-size:1rem;">💸 Layered Money Laundering Flow (Sankey Diagram)</h3>
        <span class="live-badge"><span class="live-dot"></span> Auto-Traced</span>
      </div>
      <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.5rem;">
        Shows how criminal funds travel from victim accounts → mule layers → hawala cash-outs and crypto wallets.
      </p>
      <div id="chartSankey" style="width:100%;height:420px;"></div>
    `;
    fin.appendChild(div);
  }

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #5: INTERACTIVE CASE STORYBOARD
     Drag-and-drop mind-map for case narrative assembly
     ═══════════════════════════════════════════════════════════ */
  let sbNodes    = [];
  let sbEdges    = [];
  let sbNodeId   = 0;
  let draggingNode = null;
  let dragOffsetX  = 0;
  let dragOffsetY  = 0;

  const NODE_TEMPLATES = {
    suspect:  { type: "SUSPECT",  cssClass: "suspect-node",  icon: "🔴", defaultTitle: "Unknown Suspect", defaultSub: "Risk: High" },
    upi:      { type: "UPI FLOW", cssClass: "upi-node",      icon: "💸", defaultTitle: "UPI Transaction", defaultSub: "Amount: ₹??" },
    fir:      { type: "FIR",      cssClass: "fir-node",      icon: "📄", defaultTitle: "FIR Case",        defaultSub: "Status: Under Investigation" },
    location: { type: "LOCATION", cssClass: "location-node", icon: "📍", defaultTitle: "Crime Location",  defaultSub: "District: Bengaluru" },
  };

  function getStaggeredPosition() {
    const canvas = document.getElementById("storyboardCanvas");
    if (!canvas) return { x: 80, y: 80 };
    const cols = 3;
    const idx  = sbNodes.length % (cols * 3);
    return {
      x: 40 + (idx % cols) * 220,
      y: 60 + Math.floor(idx / cols) * 140
    };
  }

  function renderStoryboardEdges() {
    const svg = document.getElementById("storyboardSvg");
    if (!svg) return;
    svg.innerHTML = "";

    // Draw bezier curves between consecutive nodes
    for (let i = 1; i < sbNodes.length; i++) {
      const a = sbNodes[i - 1];
      const b = sbNodes[i];
      const ax = a.x + 75, ay = a.y + 40;
      const bx = b.x + 75, by = b.y + 40;
      const cx1 = (ax + bx) / 2, cy1 = ay;
      const cx2 = (ax + bx) / 2, cy2 = by;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${ax},${ay} C${cx1},${cy1} ${cx2},${cy2} ${bx},${by}`);
      path.setAttribute("class", "sb-edge");
      svg.appendChild(path);

      // Arrow head
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const angle = Math.atan2(by - cy2, bx - cx2);
      const arrowLen = 8;
      const p1 = `${bx},${by}`;
      const p2 = `${bx - arrowLen * Math.cos(angle - 0.4)},${by - arrowLen * Math.sin(angle - 0.4)}`;
      const p3 = `${bx - arrowLen * Math.cos(angle + 0.4)},${by - arrowLen * Math.sin(angle + 0.4)}`;
      arrow.setAttribute("points", `${p1} ${p2} ${p3}`);
      arrow.setAttribute("fill", getComputedStyle(document.documentElement).getPropertyValue("--border-color").trim() || "#444");
      svg.appendChild(arrow);
    }
  }

  function addStoryboardNode(tplKey) {
    const canvas = document.getElementById("storyboardCanvas");
    if (!canvas) return;
    const tpl = NODE_TEMPLATES[tplKey];
    const pos = getStaggeredPosition();
    const id  = `sbnode-${++sbNodeId}`;
    const nodeData = { id, x: pos.x, y: pos.y, ...tpl };
    sbNodes.push(nodeData);

    const nodeEl = document.createElement("div");
    nodeEl.className = `storyboard-node ${tpl.cssClass}`;
    nodeEl.id = id;
    nodeEl.style.left = pos.x + "px";
    nodeEl.style.top  = pos.y + "px";
    nodeEl.innerHTML = `
      <div class="sn-type">${tpl.icon} ${tpl.type}</div>
      <div class="sn-title" contenteditable="true" spellcheck="false">${tpl.defaultTitle}</div>
      <div class="sn-sub" contenteditable="true" spellcheck="false">${tpl.defaultSub}</div>
    `;

    // Dragging
    nodeEl.addEventListener("mousedown", (e) => {
      if (e.target.hasAttribute("contenteditable")) return; // allow editing
      draggingNode = nodeEl;
      const rect = nodeEl.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      nodeEl.style.zIndex = "100";
      e.preventDefault();
    });

    canvas.appendChild(nodeEl);
    renderStoryboardEdges();
    lucide.createIcons(); // re-initialize lucide icons
  }

  // Global mousemove and mouseup for drag
  const sbCanvas = document.getElementById("storyboardCanvas");
  if (sbCanvas) {
    document.addEventListener("mousemove", (e) => {
      if (!draggingNode) return;
      const canvasRect = sbCanvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffsetX;
      const newY = e.clientY - canvasRect.top  - dragOffsetY;
      draggingNode.style.left = Math.max(0, newX) + "px";
      draggingNode.style.top  = Math.max(0, newY) + "px";
      // Update node data
      const nd = sbNodes.find(n => n.id === draggingNode.id);
      if (nd) { nd.x = Math.max(0, newX); nd.y = Math.max(0, newY); }
      renderStoryboardEdges();
    });

    document.addEventListener("mouseup", () => {
      if (draggingNode) {
        draggingNode.style.zIndex = "10";
        draggingNode = null;
      }
    });

    // Toolbar buttons
    const btnAddS = document.getElementById("btnAddSuspectNode");
    const btnAddU = document.getElementById("btnAddUpiNode");
    const btnAddF = document.getElementById("btnAddFirNode");
    const btnAddL = document.getElementById("btnAddLocationNode");
    const btnClr  = document.getElementById("btnClearBoard");

    if (btnAddS) btnAddS.addEventListener("click", () => addStoryboardNode("suspect"));
    if (btnAddU) btnAddU.addEventListener("click", () => addStoryboardNode("upi"));
    if (btnAddF) btnAddF.addEventListener("click", () => addStoryboardNode("fir"));
    if (btnAddL) btnAddL.addEventListener("click", () => addStoryboardNode("location"));
    if (btnClr)  btnClr.addEventListener("click", () => {
      sbNodes = [];
      sbEdges = [];
      sbNodeId = 0;
      sbCanvas.querySelectorAll(".storyboard-node").forEach(n => n.remove());
      renderStoryboardEdges();
    });

    // Auto-seed with a starting case when section is first shown
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.dataset.target === "sectionStoryboard") {
        item.addEventListener("click", () => {
          if (sbNodes.length === 0) {
            setTimeout(() => {
              addStoryboardNode("fir");
              addStoryboardNode("suspect");
              addStoryboardNode("upi");
              addStoryboardNode("location");
            }, 100);
          }
        });
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #6: ENHANCED TYPING INDICATOR IN CHAT
     ═══════════════════════════════════════════════════════════ */
  function showTypingIndicator() {
    const existing = document.getElementById("typingIndicatorBubble");
    if (existing) return;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble model";
    bubble.id = "typingIndicatorBubble";
    bubble.innerHTML = `
      <div class="avatar">AI</div>
      <div class="bubble-content">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    el.chatHistory.appendChild(bubble);
    el.chatHistory.scrollTop = el.chatHistory.scrollHeight;
  }

  function hideTypingIndicator() {
    const el_typing = document.getElementById("typingIndicatorBubble");
    if (el_typing) el_typing.remove();
  }

  // Hook into the existing chat form submit to show/hide typing indicator
  const _chatForm = document.getElementById("chatForm");
  if (_chatForm) {
    _chatForm.addEventListener("submit", () => {
      setTimeout(showTypingIndicator, 50);
    }, true); // capture phase — fires before existing listeners
  }

  // Intercept fetch responses to remove typing indicator
  const _origFetch = window.fetch;
  window.fetch = async function(...args) {
    const result = await _origFetch.apply(this, args);
    // Clone response to inspect without consuming
    const cloned = result.clone();
    cloned.json().then(() => {
      if (args[0] && String(args[0]).includes("/api/chat")) {
        hideTypingIndicator();
      }
    }).catch(() => {});
    return result;
  };

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #7: LIVE SYNC CLOCK + AUDIT BADGE COUNTER
     ═══════════════════════════════════════════════════════════ */
  function updateLiveSyncTime() {
    const el_sync = document.getElementById("lastSyncTime");
    if (el_sync) {
      const now = new Date();
      el_sync.textContent = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
  }
  setInterval(updateLiveSyncTime, 1000);
  updateLiveSyncTime();

  // Keep audit badge in sync with audit log count
  const _origAuditRender = window._kspRenderAudit;
  setInterval(() => {
    const badge = document.getElementById("auditBadgeCount");
    if (badge && appState.auditLogs) {
      badge.textContent = appState.auditLogs.length > 99 ? "99+" : appState.auditLogs.length;
    }
  }, 3000);

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #8: SECTION-AWARE SANKEY INITIALIZATION
     ═══════════════════════════════════════════════════════════ */
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (item.dataset.target === "sectionFinancial") {
        setTimeout(() => {
          ensureSankeySection();
          initSankeyChart();
        }, 200);
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #9: MO RADAR CHART (ECharts Radar)
     Added to the MO Lead Matcher section after a match
     ═══════════════════════════════════════════════════════════ */
  let radarChartInstance = null;

  function renderMoRadarChart(suspects) {
    if (!suspects || suspects.length === 0) return;

    let container = document.getElementById("chartMoRadar");
    if (!container) {
      const decisionSec = document.getElementById("sectionDecision");
      const card = document.createElement("div");
      card.className = "card";
      card.style.marginTop = "1.5rem";
      card.innerHTML = `
        <div class="card-header">
          <h3 style="font-weight:700;font-size:1rem;">🕸 MO Signature Radar — Criminological Profile Comparison</h3>
        </div>
        <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.5rem;">
          Compares matched suspect's behavioral MO attributes against average criminal baselines.
        </p>
        <div id="chartMoRadar" style="width:100%;height:380px;"></div>
      `;
      decisionSec.appendChild(card);
      container = document.getElementById("chartMoRadar");
    }

    if (radarChartInstance) radarChartInstance.dispose();
    radarChartInstance = echarts.init(container);

    const s = suspects[0];
    const textColor = document.documentElement.classList.contains("dark") ? "#a1a1aa" : "#475569";

    radarChartInstance.setOption({
      backgroundColor: "transparent",
      tooltip: {},
      legend: {
        data: [s.name.split("(")[0].trim(), "Avg Criminal Baseline"],
        textStyle: { color: textColor, fontFamily: "DM Sans", fontSize: 11 }
      },
      radar: {
        indicator: [
          { name: "Planning\nLevel",   max: 100 },
          { name: "Violence\nIndex",   max: 100 },
          { name: "Digital\nFootprint",max: 100 },
          { name: "Network\nSize",     max: 100 },
          { name: "Recidivism\nRisk",  max: 100 },
          { name: "Financial\nCrime",  max: 100 },
        ],
        radius: "62%",
        splitArea: { areaStyle: { color: ["rgba(59,130,246,0.03)", "rgba(59,130,246,0.06)"] } },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
        axisName: { color: textColor, fontFamily: "DM Sans", fontSize: 10 },
      },
      series: [{
        type: "radar",
        data: [
          {
            value: [
              Math.min(100, s.risk_score - 10),
              s.crime === "Homicide" || s.crime === "Assault" ? 85 : 30,
              s.crime === "Cybercrime" ? 92 : 20,
              Math.min(100, (s.risk_score / 100) * 80 + 15),
              s.risk_score,
              s.crime === "Cybercrime" || s.crime === "Extortion" ? 88 : 40,
            ],
            name: s.name.split("(")[0].trim(),
            itemStyle: { color: "#f43f5e" },
            areaStyle: { color: "rgba(244,63,94,0.15)" },
            lineStyle: { width: 2, color: "#f43f5e" }
          },
          {
            value: [45, 40, 38, 42, 50, 35],
            name: "Avg Criminal Baseline",
            itemStyle: { color: "#3b82f6" },
            areaStyle: { color: "rgba(59,130,246,0.1)" },
            lineStyle: { width: 2, color: "#3b82f6", type: "dashed" }
          }
        ]
      }]
    });
    window.addEventListener("resize", () => radarChartInstance && radarChartInstance.resize());
  }

  // Hook into the MO Match button to also render the radar chart
  const _origBtnMatchMo = document.getElementById("btnMatchMo");
  if (_origBtnMatchMo) {
    _origBtnMatchMo.addEventListener("click", async () => {
      // Wait for the results to come in, then render radar
      setTimeout(() => {
        if (appState._lastMoMatches && appState._lastMoMatches.length > 0) {
          renderMoRadarChart(appState._lastMoMatches);
        }
      }, 600);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     PREMIUM FEATURE #10: REAL-TIME SUSPENSE COUNTER ANIMATION
     Animates KPI numbers up from 0 on dashboard load
     ═══════════════════════════════════════════════════════════ */
  function animateCounter(element, target, duration = 1200) {
    if (!element) return;
    const isFloat = String(target).includes(".");
    const decimals = isFloat ? String(target).split(".")[1].length : 0;
    const suffix = isFloat ? "%" : "";
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current  = start + (target - start) * eased;
      element.textContent = isFloat
        ? current.toFixed(decimals) + suffix
        : Math.floor(current).toLocaleString("en-IN");
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Trigger counter animation when crimes/suspects are loaded
  const _origKpiUpdate = window._kspUpdateKPIs;
  function kspAnimateKPIs() {
    setTimeout(() => {
      animateCounter(document.getElementById("kpiTotalFirs"), 179, 1400);
      animateCounter(document.getElementById("kpiSolvedRate"), 67.8, 1600);
      animateCounter(document.getElementById("kpiSuspects"), 8, 800);
      animateCounter(document.getElementById("kpiInterstateAlerts"), 3, 600);
    }, 400);
  }
  kspAnimateKPIs();

  /* ═══════════════════════════════════════════════════════════
     VICTIM RECORDS SECTION: Fetch & Render
     ═══════════════════════════════════════════════════════════ */
  let victimsLoaded = false;

  async function loadVictimSection() {
    if (victimsLoaded) return;
    victimsLoaded = true;

    try {
      const res  = await fetch(API_BASE + "/api/victims");
      const victims = await res.json();

      // --- KPI Summary Row ---
      const kpiRow = document.getElementById("victimKpiRow");
      if (kpiRow) {
        const totalLoss    = victims.reduce((s, v) => s + v.loss_amount, 0);
        const femaleCount  = victims.filter(v => v.gender === "Female").length;
        const seniorCount  = victims.filter(v => v.age >= 60).length;
        const cyberCount   = victims.filter(v => v.crime_type === "Cybercrime").length;

        const kpis = [
          { label: "Registered Victims", value: victims.length, icon: "🫂", color: "var(--accent-color)" },
          { label: "Total Financial Loss", value: "₹" + totalLoss.toLocaleString("en-IN"), icon: "💸", color: "var(--error-color)" },
          { label: "Female Victims", value: femaleCount, icon: "👩", color: "var(--warning-color)" },
          { label: "Cyber Fraud Victims", value: cyberCount, icon: "🖥️", color: "var(--success-color)" },
        ];

        kpiRow.innerHTML = kpis.map(k => `
          <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:1rem; text-align:center;">
            <div style="font-size:1.6rem; margin-bottom:0.25rem;">${k.icon}</div>
            <div style="font-size:1.25rem; font-weight:800; color:${k.color};">${k.value}</div>
            <div style="font-size:0.72rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-top:0.1rem;">${k.label}</div>
          </div>
        `).join("");
      }

      // --- Victim Cards ---
      const list = document.getElementById("victimCardsList");
      if (!list) return;
      list.innerHTML = "";

      const statusColors = {
        "Under Investigation": "var(--warning-color)",
        "Chargesheet Filed":   "var(--success-color)",
        "Complaint Filed":     "var(--accent-color)",
      };

      const crimeIcons = {
        "Cybercrime":        "🖥️",
        "Extortion":         "🔫",
        "Drug Trafficking":  "💊",
        "Theft":             "🔓",
      };

      victims.forEach(v => {
        const card = document.createElement("div");
        card.style.cssText = `
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        `;

        const isSenior  = v.age >= 60;
        const isFemale  = v.gender === "Female";
        const statusColor = statusColors[v.status] || "var(--text-muted)";
        const crimeIcon   = crimeIcons[v.crime_type] || "⚠️";

        // Vulnerability tags
        const vulnTags = [];
        if (isSenior) vulnTags.push({ label: "Senior Citizen", color: "var(--warning-color)" });
        if (isFemale) vulnTags.push({ label: "Female", color: "#a855f7" });
        if (v.crime_type === "Cybercrime") vulnTags.push({ label: "Digital Fraud", color: "var(--accent-color)" });
        if (v.loss_amount > 100000) vulnTags.push({ label: "High Financial Loss", color: "var(--error-color)" });

        const tagsHTML = vulnTags.map(t => `
          <span style="background: transparent; border:1px solid ${t.color}; color:${t.color};
                       font-size:0.65rem; font-weight:700; padding:0.15rem 0.5rem; border-radius:9999px;
                       letter-spacing:0.04em;">${t.label}</span>
        `).join("");

        // Find linked suspect name
        const linkedSuspect = appState.suspects.find(s => s.id === v.suspect_id);
        const suspectName   = linkedSuspect ? linkedSuspect.name : v.suspect_id;

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <div style="font-size:1rem; font-weight:800; color:var(--text-primary);">
                ${crimeIcon} ${v.name}
                <span style="font-size:0.78rem; font-weight:500; color:var(--text-muted);">(${v.age}, ${v.gender} · ${v.occupation})</span>
              </div>
              <div style="display:flex; gap:0.35rem; margin-top:0.35rem; flex-wrap:wrap;">${tagsHTML}</div>
            </div>
            <div style="text-align:right; flex-shrink:0;">
              <span style="background:transparent; border:1px solid ${statusColor}; color:${statusColor};
                           font-size:0.7rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:9999px;">${v.status}</span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; font-size:0.8rem;">
            <div>
              <div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:700;">FIR Number</div>
              <div style="font-weight:600; color:var(--text-primary); margin-top:0.15rem;">${v.fir_no}</div>
            </div>
            <div>
              <div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:700;">Crime Type</div>
              <div style="font-weight:600; color:var(--text-primary); margin-top:0.15rem;">${v.crime_type}</div>
            </div>
            <div>
              <div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:700;">Financial Loss</div>
              <div style="font-weight:700; color:var(--error-color); margin-top:0.15rem;">
                ${v.loss_amount > 0 ? "₹" + v.loss_amount.toLocaleString("en-IN") : "Non-monetary"}
              </div>
            </div>
            <div>
              <div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:700;">District</div>
              <div style="font-weight:600; color:var(--text-primary); margin-top:0.15rem;">${v.district}</div>
            </div>
            <div>
              <div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:700;">Incident Date</div>
              <div style="font-weight:600; color:var(--text-primary); margin-top:0.15rem;">${v.date}</div>
            </div>
            <div>
              <div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:700;">Linked Suspect</div>
              <div style="font-weight:700; color:var(--error-color); margin-top:0.15rem;" title="${v.suspect_id}">${suspectName}</div>
            </div>
          </div>

          <div style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; padding:0.75rem; font-size:0.8rem;">
            <div style="font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem;">📝 Incident Description</div>
            <div style="color:var(--text-secondary); line-height:1.5;">${v.description}</div>
          </div>

          <div style="background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.2); border-radius:8px; padding:0.6rem 0.75rem; font-size:0.78rem;">
            <span style="font-weight:700; color:var(--warning-color);">⚠ Vulnerability Factor: </span>
            <span style="color:var(--text-secondary);">${v.vulnerability_factor}</span>
          </div>
        `;

        // Hover effect
        card.addEventListener("mouseenter", () => {
          card.style.borderColor = "rgba(59,130,246,0.3)";
          card.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
        });
        card.addEventListener("mouseleave", () => {
          card.style.borderColor = "var(--border-color)";
          card.style.boxShadow = "none";
        });

        list.appendChild(card);
      });

    } catch(e) {
      console.error("Victim section error:", e);
    }
  }

  // Load victims when nav item clicked
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.dataset.target === "sectionVictims") {
      item.addEventListener("click", () => setTimeout(loadVictimSection, 150));
    }
  });

});
