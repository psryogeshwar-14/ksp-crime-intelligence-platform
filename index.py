import os
import json
import logging
from datetime import datetime, timedelta
import random
from flask import Flask, Request, jsonify, make_response

# Initialize Flask app
app = Flask("ksp-crime-db-api")

# Audit logs store in memory
audit_logs = [
    {
        "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat(),
        "user": "Inspector Kumar (Investigator)",
        "action": "Suspect MO Query Run",
        "details": "Queried suspect database for Modus Operandi matching daytime lock breaking in Bengaluru City.",
        "sql_executed": "SELECT * FROM suspects WHERE district = 'Bengaluru City' AND mo LIKE '%lock%';"
    },
    {
        "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat(),
        "user": "System (Automated Scheduler)",
        "action": "Threat Alert Broadcast",
        "details": "Broadcasted interstate checkpoint warning to Tamil Nadu and Kerala border checkposts.",
        "sql_executed": "UPDATE alerts SET status = 'Broadcasted' WHERE border = 'KA-TN' OR border = 'KA-KL';"
    },
    {
        "timestamp": (datetime.now() - timedelta(minutes=45)).isoformat(),
        "user": "DSP Patil (Superintendent)",
        "action": "UPI Flow Audit",
        "details": "Analyzed money laundering flows from account HDFC-993 to shell entities.",
        "sql_executed": "SELECT source, target, SUM(amount) FROM upi_transactions GROUP BY source, target HAVING SUM(amount) > 100000;"
    },
    {
        "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
        "user": "System (Automated Indexer)",
        "action": "Biometric Indexing",
        "details": "Completed daily matching index optimization on KSP suspect fingerprint database.",
        "sql_executed": "REINDEX INDEX suspect_fingerprints_idx;"
    },
    {
        "timestamp": (datetime.now() - timedelta(hours=3)).isoformat(),
        "user": "Inspector Kumar (Investigator)",
        "action": "User Login",
        "details": "Successful credentials authentication from station terminal whitefield-04.",
        "sql_executed": "SELECT user_id, role FROM users WHERE username = 'ksp_invest' AND status = 'Active';"
    }
]

# --- Mock Database Generation ---
districts_data = {
    "Bengaluru City": {"lat": 12.9716, "lng": 77.5946, "stations": ["Koramangala Police Station", "Indiranagar Police Station", "Halasuru Gate Police Station", "Majestic Metro Station PS", "Whitefield Police Station", "Jayanagar Police Station", "Yeshwanthpur Police Station"]},
    "Mysuru": {"lat": 12.2958, "lng": 76.6394, "stations": ["Lashkar Police Station", "K.R. Puram Police Station", "Vyalikaval Police Station", "Nazarbad Police Station", "Devaraja Police Station"]},
    "Hubli-Dharwad": {"lat": 15.3647, "lng": 75.1240, "stations": ["Gokul Road Police Station", "Town Police Station Hubli", "Suburban Police Station", "Vidyagiri Police Station"]},
    "Mangaluru": {"lat": 12.9141, "lng": 74.8560, "stations": ["Pandeshwar Police Station", "Urwa Police Station", "Kadri Police Station", "Barkur Police Station"]},
    "Belagavi": {"lat": 15.8497, "lng": 74.4977, "stations": ["Khade Bazar Police Station", "Shahapur Police Station", "Market Police Station"]},
    "Kalaburagi": {"lat": 17.3297, "lng": 76.8343, "stations": ["Chowk Police Station", "Station Bazar Police Station", "Raghavendra Nagar PS"]}
}

socio_economic_db = {
    "Bengaluru City": {"literacy": 88.5, "urbanization": 92.3, "migration_index": 75.0, "unemployment": 6.2, "economic_stress": "Low", "description": "High digital penetration. Target area for UPI cyber frauds, social media polarization, and transient student migrations."},
    "Mysuru": {"literacy": 82.1, "urbanization": 65.4, "migration_index": 35.0, "unemployment": 7.1, "economic_stress": "Medium", "description": "High tourism index. Minor occurrences of organized drug supply chains correlation with local hostels."},
    "Hubli-Dharwad": {"literacy": 80.2, "urbanization": 58.6, "migration_index": 28.0, "unemployment": 8.3, "economic_stress": "Medium-High", "description": "Commercial railway transit hub. Correlates with property theft and local syndicate transit links."},
    "Mangaluru": {"literacy": 94.0, "urbanization": 72.1, "migration_index": 48.0, "unemployment": 5.8, "economic_stress": "Low", "description": "Highly educated. Susceptible to cross-border drug networks from neighboring Kerala and offshore hawala pipelines."},
    "Belagavi": {"literacy": 75.6, "urbanization": 42.1, "migration_index": 22.0, "unemployment": 7.9, "economic_stress": "High", "description": "Bordering Maharashtra. Prone to interstate smuggling networks, vehicle theft syndicates, and land dispute unrest."},
    "Kalaburagi": {"literacy": 64.3, "urbanization": 30.5, "migration_index": 42.0, "unemployment": 11.2, "economic_stress": "Very High", "description": "Semi-arid region. Correlates with agrarian economic stress, outward migration surges, and property theft patterns."}
}

crime_types = ["Cybercrime", "Theft", "Assault", "Drug Trafficking", "Rioting", "Homicide", "Extortion"]
crime_statuses = ["Solved", "Under Investigation", "Closed", "Under Trial"]
severities = ["Low", "Medium", "High"]

suspects = [
    {"id": "S101", "name": "Ravi Kumar (alias 'Cat Ravi')", "age": 34, "crime": "Theft", "status": "Active", "risk_score": 85, "phone": "+91 98840 21321", "bank": "SBI 3029103212", "vehicle": "KA-01-MJ-2041", "district": "Bengaluru City", "lat": 12.9650, "lng": 77.5850, "mo": "Daytime lock tampering in residential areas"},
    {"id": "S102", "name": "Anwar Pasha (alias 'Kulla')", "age": 42, "crime": "Extortion", "status": "Monitored", "risk_score": 75, "phone": "+91 94480 32415", "bank": "Canara 10294821", "vehicle": "KA-03-EB-5832", "district": "Bengaluru City", "lat": 12.9800, "lng": 77.6100, "mo": "Threatening local builders and merchants for protection money"},
    {"id": "S103", "name": "Vikram Singh (alias 'Vicky')", "age": 28, "crime": "Cybercrime", "status": "Absconding", "risk_score": 92, "phone": "+91 88610 93241", "bank": "HDFC 501029482", "vehicle": "KA-51-P-9921", "district": "Bengaluru City", "lat": 12.9550, "lng": 77.6200, "mo": "Hosting phishing domains and executing UPI phishing scams"},
    {"id": "S104", "name": "Manju Gowda", "age": 39, "crime": "Assault", "status": "Arrested", "risk_score": 60, "phone": "+91 99000 12345", "bank": "KVB 20931849", "vehicle": "KA-05-MM-1221", "district": "Mysuru", "lat": 12.3020, "lng": 76.6450, "mo": "Physical altercation over real estate borders"},
    {"id": "S105", "name": "Suresh Gowda", "age": 45, "crime": "Drug Trafficking", "status": "Active", "risk_score": 89, "phone": "+91 99800 87654", "bank": "SBI 492019482", "vehicle": "KA-09-H-4567", "district": "Mysuru", "lat": 12.2880, "lng": 76.6320, "mo": "Bulk distribution of synthetic drugs via interstate buses"},
    {"id": "S106", "name": "Vijay Shetty", "age": 31, "crime": "Rioting", "status": "Active", "risk_score": 70, "phone": "+91 97410 43210", "bank": "Canara 403912849", "vehicle": "KA-19-M-1122", "district": "Mangaluru", "lat": 12.9210, "lng": 74.8620, "mo": "Instigating border protests and public property damage"},
    {"id": "S107", "name": "Shrikant Kulkarni", "age": 51, "crime": "Homicide", "status": "Arrested", "risk_score": 95, "phone": "+91 94800 55566", "bank": "BoB 9201849201", "vehicle": "KA-25-N-3344", "district": "Hubli-Dharwad", "lat": 15.3700, "lng": 75.1300, "mo": "Contract killing associated with land mafias"},
    {"id": "S108", "name": "Basavaraj Patil", "age": 37, "crime": "Theft", "status": "Monitored", "risk_score": 65, "phone": "+91 99450 11223", "bank": "SBI 1029482103", "vehicle": "KA-28-V-8899", "district": "Belagavi", "lat": 15.8550, "lng": 74.5050, "mo": "Nighttime housebreaking during festivals"}
]

upi_transactions = [
    {"tx_id": "TXN_UPI_928103", "date": "2026-06-12", "amount": 450000, "sender": "S101 (Ravi Kumar)", "receiver": "S103 (Vikram Singh)", "bank": "SBI to HDFC", "type": "UPI-GPay", "risk": "High (Mule Account Flow)"},
    {"tx_id": "TXN_UPI_104829", "date": "2026-06-15", "amount": 125000, "sender": "S103 (Vikram)", "receiver": "Mule Acct (HDFC-993)", "bank": "HDFC to HDFC", "type": "UPI-PhonePe", "risk": "High (Phishing cash-out)"},
    {"tx_id": "TXN_UPI_302948", "date": "2026-06-20", "amount": 80000, "sender": "S105 (Suresh)", "receiver": "S101 (Ravi)", "bank": "SBI to SBI", "type": "UPI-IMPS", "risk": "Medium (Suspicious payment)"},
    {"tx_id": "TXN_UPI_583921", "date": "2026-06-25", "amount": 320000, "sender": "S102 (Anwar Pasha)", "receiver": "Mule Acct (PNB-104)", "bank": "Canara to PNB", "type": "UPI-Paytm", "risk": "Critical (Extortion trail)"}
]

interstate_alerts = [
    {"suspect_id": "S101", "state": "Tamil Nadu", "police_unit": "Hosur Police PS", "details": "Matches fingerprint records of 2024 jewel theft in Hosur."},
    {"suspect_id": "S105", "state": "Kerala", "police_unit": "Kasaragod Drug Squad", "details": "Frequent border vehicle crossings (KA-09-H-4567) under investigation."},
    {"suspect_id": "S108", "state": "Maharashtra", "police_unit": "Kolhapur Crime Branch", "details": "Wanted in Kolhapur for border highway vehicle looting."}
]

network_links = [
    {"source": "S101", "target": "S102", "type": "Accomplice", "details": "Co-accused in 2024 heist case"},
    {"source": "S101", "target": "S103", "type": "Financial transaction", "details": "Transferred ₹4,50,000 on 2026-03-12 (UPI)"},
    {"source": "S102", "target": "S103", "type": "Phone Call", "details": "12 calls exchanged in June 2026"},
    {"source": "S104", "target": "S105", "type": "Accomplice", "details": "Joint arrests in drug bust 2025"},
    {"source": "S101", "target": "S105", "type": "Phone Call", "details": "Frequent logs across district border"},
    {"source": "S106", "target": "S101", "type": "vehicle share", "details": "Used KA-01-MJ-2041 on 2026-05-15"},
    {"source": "S107", "target": "S108", "type": "Family", "details": "Maternal cousins with linked bank accounts"}
]

victims_db = [
    {
        "id": "V001",
        "name": "Priya Nair",
        "age": 28,
        "gender": "Female",
        "occupation": "Software Engineer",
        "district": "Bengaluru City",
        "crime_type": "Cybercrime",
        "fir_no": "FIR/BEN/2026/0087",
        "date": "2026-04-12",
        "suspect_id": "S103",
        "loss_amount": 85000,
        "description": "Victim received a phishing call impersonating HDFC Bank. Lost ₹85,000 via UPI to a mule account. Suspect S103 linked via IP trail.",
        "status": "Under Investigation",
        "vulnerability_factor": "First-time digital banking user, high-trust susceptibility"
    },
    {
        "id": "V002",
        "name": "Mohammed Rafi",
        "age": 55,
        "gender": "Male",
        "occupation": "Textile Merchant",
        "district": "Bengaluru City",
        "crime_type": "Extortion",
        "fir_no": "FIR/BEN/2026/0031",
        "date": "2026-03-05",
        "suspect_id": "S102",
        "loss_amount": 320000,
        "description": "Local textile shop owner threatened with arson by organized gang. Paid extortion money via Paytm under duress. S102 (Anwar Pasha) identified as ring leader.",
        "status": "Chargesheet Filed",
        "vulnerability_factor": "Sole proprietor business, no security staff, isolated locality"
    },
    {
        "id": "V003",
        "name": "Sunitha Gowda",
        "age": 42,
        "gender": "Female",
        "occupation": "Homemaker",
        "district": "Mysuru",
        "crime_type": "Drug Trafficking",
        "fir_no": "FIR/MYS/2026/0019",
        "date": "2026-02-18",
        "suspect_id": "S105",
        "loss_amount": 0,
        "description": "Victim's minor son became addicted to synthetic drugs supplied by S105 (Suresh Gowda) via neighbourhood networks near school premises.",
        "status": "Under Investigation",
        "vulnerability_factor": "Minor child, educational institution proximity, peer pressure"
    },
    {
        "id": "V004",
        "name": "Ramesh Kulkarni",
        "age": 67,
        "gender": "Male",
        "occupation": "Retired Government Officer",
        "district": "Bengaluru City",
        "crime_type": "Theft",
        "fir_no": "FIR/BEN/2026/0103",
        "date": "2026-05-22",
        "suspect_id": "S101",
        "loss_amount": 175000,
        "description": "Residence broken into during daytime. Gold jewellery and cash stolen. Lock was tampered — signature MO matches S101 (Ravi Kumar, alias Cat Ravi).",
        "status": "Under Investigation",
        "vulnerability_factor": "Elderly, living alone, ground-floor house with weak lock"
    },
    {
        "id": "V005",
        "name": "Kavya Shetty",
        "age": 23,
        "gender": "Female",
        "occupation": "College Student",
        "district": "Mangaluru",
        "crime_type": "Cybercrime",
        "fir_no": "FIR/MAN/2026/0008",
        "date": "2026-01-30",
        "suspect_id": "S103",
        "loss_amount": 42000,
        "description": "Victim defrauded via fake part-time job offer sent on WhatsApp. Task-based fraud — paid ₹42,000 as 'investment' before realizing the scam.",
        "status": "Complaint Filed",
        "vulnerability_factor": "Young adult, unemployed, social media active, financial pressure"
    }
]

crimes_db = []
start_date = datetime(2025, 1, 1)
random.seed(42)
for i in range(1, 180):
    district = random.choice(list(districts_data.keys()))
    station = random.choice(districts_data[district]["stations"])
    ctype = random.choice(crime_types)
    status = random.choice(crime_statuses)
    sev = random.choice(severities)
    
    lat_offset = random.uniform(-0.025, 0.025)
    lng_offset = random.uniform(-0.025, 0.025)
    lat = districts_data[district]["lat"] + lat_offset
    lng = districts_data[district]["lng"] + lng_offset
    
    sus = None
    if random.random() < 0.4:
        sus = random.choice([s for s in suspects if s["district"] == district] or suspects)
        
    date_occurred = start_date + timedelta(days=random.randint(0, 550))
    
    solved_officer = "N/A"
    if status == "Solved":
        solved_officer = random.choice([
            "Inspector Kumar (Investigator)", 
            "PSI Gowda (Special Branch)", 
            "DSP Patil (CID)",
            "Inspector Shinde (Crime Branch)"
        ])
        
    crimes_db.append({
        "fir_no": f"FIR/{district[:3].upper()}/{date_occurred.strftime('%Y')}/{i:04d}",
        "date": date_occurred.strftime("%Y-%m-%d"),
        "district": district,
        "police_station": station,
        "crime_type": ctype,
        "status": status,
        "severity": sev,
        "suspect": sus["name"] if sus else "Unidentified",
        "suspect_id": sus["id"] if sus else None,
        "lat": round(lat, 5),
        "lng": round(lng, 5),
        "description": f"Incident reported near {station}. Investigations ongoing. Suspect {sus['name'] if sus else 'unidentified'}. Modus Operandi matches {sus['mo'] if sus else 'unknown technique'}.",
        "solved_by": solved_officer
    })
crimes_db.sort(key=lambda x: x["date"], reverse=True)


def add_audit_log(user: str, action: str, details: str, sql_executed: str = "N/A"):
    log = {
        "timestamp": datetime.now().isoformat(),
        "user": user,
        "action": action,
        "details": details,
        "sql_query": sql_executed
    }
    audit_logs.insert(0, log)
    if len(audit_logs) > 100:
        audit_logs.pop()


# --- CORS Middleware helper ---
@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response


# --- Flask Route Mapping ---

@app.route("/api/login", methods=["POST", "OPTIONS"])
def login():
    from flask import request
    if request.method == "OPTIONS":
        return make_response("", 200)
    req = request.get_json() or {}
    username = req.get("username")
    password = req.get("password")
    role = req.get("role")
    
    if username == "admin" and password == "admin123" and role == "Admin":
        add_audit_log("admin", "User Login", "Admin successfully logged in")
        return jsonify({"success": True, "token": "token-admin", "role": "Admin", "name": "Administrator"})
    elif username == "ksp_super" and password == "super123" and role == "Superintendent":
        add_audit_log("ksp_super", "User Login", "Superintendent successfully logged in")
        return jsonify({"success": True, "token": "token-super", "role": "Superintendent", "name": "SP Patil"})
    elif username == "ksp_invest" and password == "invest123" and role == "Investigator":
        add_audit_log("ksp_invest", "User Login", "Investigator successfully logged in")
        return jsonify({"success": True, "token": "token-invest", "role": "Investigator", "name": "Inspector Kumar"})
    
    return make_response(jsonify({"success": False, "message": "Invalid credentials or role mismatch"}), 401)


@app.route("/api/crimes", methods=["GET"])
def get_crimes():
    from flask import request
    district = request.args.get("district")
    ctype = request.args.get("type")
    status = request.args.get("status")
    limit = int(request.args.get("limit", 100))
    
    results = crimes_db
    if district:
        results = [c for c in results if c["district"] == district]
    if ctype:
        results = [c for c in results if c["crime_type"] == ctype]
    if status:
        results = [c for c in results if c["status"] == status]
        
    return jsonify(results[:limit])


@app.route("/api/suspects", methods=["GET"])
def get_suspects():
    return jsonify(suspects)


@app.route("/api/upi-trails", methods=["GET"])
def get_upi_trails():
    return jsonify(upi_transactions)


@app.route("/api/interstate-alerts", methods=["GET"])
def get_interstate_alerts():
    return jsonify(interstate_alerts)


@app.route("/api/socio-economic", methods=["GET"])
def get_socio_economic():
    return jsonify(socio_economic_db)


@app.route("/api/network", methods=["GET"])
def get_network():
    return jsonify({
        "nodes": [{"id": s["id"], "name": s["name"], "risk": s["risk_score"], "crime": s["crime"], "status": s["status"], "habitual": s["risk_score"] >= 80} for s in suspects],
        "links": network_links
    })


@app.route("/api/victims", methods=["GET"])
def get_victims():
    from flask import request
    district = request.args.get("district")
    ctype = request.args.get("crime_type")
    suspect_id = request.args.get("suspect_id")
    
    results = victims_db
    if district:
        results = [v for v in results if v["district"] == district]
    if ctype:
        results = [v for v in results if v["crime_type"] == ctype]
    if suspect_id:
        results = [v for v in results if v["suspect_id"] == suspect_id]
        
    add_audit_log("System", "Victim Records Query", f"Fetched victim profiles — filters: district={district}, type={ctype}, suspect={suspect_id}",
                  f"SELECT * FROM victims WHERE suspect_id='{suspect_id}' OR district='{district}';")
    return jsonify(results)


@app.route("/api/match-mo", methods=["POST", "OPTIONS"])
def match_mo():
    from flask import request
    if request.method == "OPTIONS":
        return make_response("", 200)
    req = request.get_json() or {}
    query = (req.get("mo_text") or "").lower()
    add_audit_log("Investigator", "MO Analysis", f"Queried Modus Operandi pattern: '{query}'")
    
    matched_suspects = []
    reco = "Examine suspects utilizing lockpick kits in rural/semi-urban boundaries."
    
    if "lock" in query or "daytime" in query or "tamper" in query:
        matched_suspects = [s for s in suspects if s["id"] == "S101"]
        reco = "Assess neighborhood surveillance footage near residential properties. Monitor vehicle KA-01-MJ-2041."
    elif "phish" in query or "upi" in query or "cyber" in query:
        matched_suspects = [s for s in suspects if s["id"] == "S103"]
        reco = "Coordinate with HDFC fraud desk. Freeze transaction account 501029482 immediately."
    elif "drug" in query or "bus" in query or "smuggl" in query:
        matched_suspects = [s for s in suspects if s["id"] == "S105"]
        reco = "Install checkpoints along Mysuru border roads. Cross-reference Kasaragod interstate logs."
    else:
        matched_suspects = [suspects[0], suspects[7]]
        
    sql = f"SELECT id, name, mo FROM suspects WHERE mo LIKE '%{query}%';"

    # Enrich matches
    res_matches = []
    for s_orig in matched_suspects:
        s = s_orig.copy()
        s["habitual_offender"] = s["risk_score"] >= 80
        s["linked_victims"] = [v["name"] for v in victims_db if v["suspect_id"] == s["id"]]
        s["victim_count"] = len(s["linked_victims"])
        res_matches.append(s)

    return jsonify({
        "success": True,
        "matches": res_matches,
        "sql": sql,
        "recommendations": reco
    })


@app.route("/api/audit-logs", methods=["GET"])
def get_audit_logs():
    return jsonify(audit_logs)


@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat_endpoint():
    from flask import request
    if request.method == "OPTIONS":
        return make_response("", 200)
    req = request.get_json() or {}
    message = req.get("message") or ""
    msg = message.lower()
    role = req.get("role") or "Investigator"
    
    add_audit_log(role, "Chat Query", f"User queried: '{message}'")
    is_kannada = any(word in msg for word in ["ಬೆಂಗಳೂರು", "ಅಪರಾಧ", "ವಿವರ", "ಯಾರು", "ನಕ್ಷೆ", "ಕನ್ನಡ", "ಹಲೋ", "ಅಧ್ಯಯನ", "ಯುಪಿಐ", "ಹಣ"])
    
    sql = "N/A"
    thoughts = ["Parsing query context...", f"Applying access role rules: {role}."]
    response_content = ""
    suggestions = []
    
    if "upi" in msg or "money" in msg or "transaction" in msg or "ಯುಪಿಐ" in msg or "ಹಣ" in msg:
        thoughts.append("Detecting financial analysis indicators.")
        thoughts.append("Joining suspects network nodes to UPI transaction records.")
        sql = "SELECT * FROM upi_transactions ORDER BY amount DESC;"
        total_volume = sum(t["amount"] for t in upi_transactions)
        high_risk_count = len([t for t in upi_transactions if "High" in t["risk"] or "Critical" in t["risk"]])
        
        if is_kannada:
            response_content = f"### ಸೈಬರ್ ಅಪರಾಧ ಮತ್ತು ಯುಪಿಐ ಹಣಕಾಸು ತನಿಖೆ\n\nಸಿಸ್ಟಮ್ ಪ್ರಸ್ತುತ **{len(upi_transactions)}** ಯುಪಿಐ ವಹಿವಾಟುಗಳನ್ನು ಪತ್ತೆ ಮಾಡಿದೆ:\n\n* **ಒಟ್ಟು ಸಂಶಯಾಸ್ಪದ ಮೊತ್ತ:** ₹{total_volume:,}\n* **ಅತಿ ಹೆಚ್ಚು ಅಪಾಯಕಾರಿ ವಹಿವಾಟುಗಳು:** {high_risk_count} ಪ್ರಕರಣಗಳು\n\n**ಹವಾಲಾ ಮತ್ತು ಶೆಲ್ ಅಕೌಂಟ್ ಎಚ್ಚರಿಕೆ:** ವಿಕ್ರಮ್ ಸಿಂಗ್ (S103) ಮತ್ತು ರವಿ ಕುಮಾರ್ (S101) ನಡುವೆ GPay ಮೂಲಕ ₹4,50,000 ಹಣ ವರ್ಗಾವಣೆಯಾಗಿರುವುದು ದೃಢಪಟ್ಟಿದೆ."
            suggestions = ["ಹಣ ವರ್ಗಾವಣೆ ನೆಟ್‌ವರ್ಕ್ ತೋರಿಸು", "ರವಿ ಕುಮಾರ್ ಹಣಕಾಸು ವಿವರ"]
        else:
            response_content = f"### Financial Crime & UPI Link Analysis\n\nOur system detected **{len(upi_transactions)}** flagged transactions linking primary suspects:\n\n* **Total Suspicious Flow Volume:** ₹{total_volume:,}\n* **High-Risk/Mule Account Flows:** {high_risk_count} records\n\n**Critical Alert**: Suspect **Vikram Singh (S103)** executed a high-volume UPI flow (GPay) of ₹4,50,000 with **Ravi Kumar (S101)**. System flags HDFC Account `501029482` as a potential mule account.\n\n*Explainable AI: Risk is flagged due to speed cash-out correlations immediately following phished calls.*"
            suggestions = ["Show network trails of S103", "View all suspicious transactions"]
        add_audit_log(role, "Database Query Execution", "Fetched UPI transaction linkages", sql)

    elif "border" in msg or "interstate" in msg or "neighbor" in msg or "ತಮಿಳುನಾಡು" in msg or "ಕೇರಳ" in msg:
        thoughts.append("Analyzing border district crime indexes (Belagavi, Mangaluru, Chamarajanagar).")
        thoughts.append("Correlating interstate border station incident records.")
        sql = "SELECT * FROM interstate_alerts INNER JOIN suspects ON interstate_alerts.suspect_id = suspects.id;"
        
        if is_kannada:
            response_content = f"### ಅಂತರರಾಜ್ಯ ಗಡಿ ಅಪರಾಧ ಎಚ್ಚರಿಕೆಗಳು\n\nಗಡಿ ಭಾಗದಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿರುವ ಶಂಕಿತರ ವಿವರಗಳು:\n\n* **ರವಿ ಕುಮಾರ್ (S101):** ತಮಿಳುನಾಡಿನ ಹೊಸೂರು ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ ಚಿನ್ನಾಭರಣ ಕಳ್ಳತನ ಪ್ರಕರಣ ದಾಖಲಾಗಿದೆ.\n* **ಸುರೇಶ್ ಗೌಡ (S105):** ಕೇರಳದ ಕಾಸರಗೋಡು ಗಡಿ ಭಾಗದಲ್ಲಿ ಮಾದಕ ದ್ರವ್ಯ ಸಾಗಾಟ ಜಾಲ ನಡೆಸುತ್ತಿದ್ದಾನೆ.\n\n**ಸೂಚನೆ:** ಅಂತರರಾಜ್ಯ ಪೊಲೀಸ್ ಘಟಕಗಳೊಂದಿಗೆ ಸಮನ್ವಯ ಸಾಧಿಸಿ."
            suggestions = ["ಸುರೇಶ್ ಗೌಡ ವಾಹನ ಸಂಖ್ಯೆ", "ಗಡಿ ರಸ್ತೆಗಳ ನಕ್ಷೆ"]
        else:
            response_content = f"### Interstate Crime Ring Alert\n\nBorder syndicates detected crossing Karnataka boundaries:\n\n1. **Ravi Kumar (S101) [Tamil Nadu Link]**: Fingerprints matched with jewel thefts at Hosur PS, TN.\n2. **Suresh Gowda (S105) [Kerala Drug Loop]**: kasaragod Drug Squad has active surveillance logs on his vehicle KA-09-H-4567.\n3. **Basavaraj Patil (S108) [Maharashtra Link]**: Wanted for highway looting by Kolhapur Crime Branch.\n\n*Proactive Policing Tip: Coordinate with neighboring border checkpoints (Hosur & Kasaragod) to restrict vehicle movements.*"
            suggestions = ["List Suresh Gowda's accomplices", "Map border crossing routes"]
        add_audit_log(role, "Database Query Execution", "Fetched interstate border alerts", sql)

    elif "socio" in msg or "demographic" in msg or "literacy" in msg or "unemployment" in msg or "ಜನಸಂಖ್ಯಾ" in msg:
        thoughts.append("Joining crime density grids with socio-economic index databases.")
        thoughts.append("Running linear correlation: crime rates vs unemployment vs literacy.")
        sql = "SELECT district, literacy, unemployment, COUNT(crimes) FROM socio_economic JOIN crimes GROUP BY district;"
        
        if is_kannada:
            response_content = f"### ಜನಸಂಖ್ಯಾ ಮತ್ತು ಸಾಮಾಜಿಕ ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ\n\nಸಾಮಾಜಿಕ ಸೂಚಕಗಳ ಪ್ರಕಾರ:\n\n* **ಕಲಬುರಗಿ (ಹೆಚ್ಚಿನ ನಿರುದ್ಯೋಗ - 11.2%):** ಆರ್ಥಿಕ ಒತ್ತಡ ಮತ್ತು ಕಳ್ಳತನ ಪ್ರಕರಣಗಳ ನಡುವೆ 82% ಸಹಸಂಬಂಧ ಕಂಡುಬಂದಿದೆ.\n* **ಮಂಗಳೂರು (ಹೆಚ್ಚಿನ ಸಾಕ್ಷರತೆ - 94.0%):** ಇಲ್ಲಿ ಹಿಂಸಾತ್ಮಕ ಅಪರಾಧ ಕಡಿಮೆ, ಆದರೆ ಹವಾಲಾ ಮತ್ತು ಸೈಬರ್ ಜಾಲಗಳು ಹೆಚ್ಚು ಸಕ್ರಿಯವಾಗಿವೆ.\n\n**ಶಿಫಾರಸು:** ಹಿಂದುಳಿದ ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಯುವಜನರಿಗೆ ಉದ್ಯೋಗ ತರಬೇತಿ ನೀಡುವುದರಿಂದ ಅಪರಾಧ ತಡೆಯಬಹುದು."
            suggestions = ["ಕಲಬುರಗಿ ಅಪರಾಧ ವರದಿ", "ಮಂಗಳೂರು ಸೈಬರ್ ಕ್ರೈಮ್"]
        else:
            response_content = f"### Socio-Demographic Crime Correlation Index\n\nCriminology analysis shows strong correlations between district socio-economic factors and crime types:\n\n1. **Kalaburagi (Unemployment: 11.2%, Literacy: 64.3%):** High correlation (82%) with property theft and minor assaults, driven by agricultural economic stress.\n2. **Mangaluru (Literacy: 94.0%):** Extremely low physical assault index, but high density of digital cybercrimes and international money loops (Hawala links).\n3. **Bengaluru City (Urbanization: 92.3%):** Highly vulnerable to automated UPI phishing networks due to massive population density and migrant student inflow.\n\n*Strategic Prevention Directive: Long-term crime reduction in high-risk zones requires targeted vocational training programs and digital safety workshops.*"
            suggestions = ["Show Kalaburagi risk index", "List socio-demographic indicators"]
        add_audit_log(role, "Database Query Execution", "Computed socio-demographic crime correlations", sql)

    elif "bengaluru" in msg or "bangalore" in msg or "ಬೆಂಗಳೂರು" in msg:
        thoughts.append("Extracting geographical filter: 'Bengaluru City'.")
        sql = "SELECT COUNT(*), crime_type FROM crimes WHERE district = 'Bengaluru City' GROUP BY crime_type ORDER BY COUNT(*) DESC;"
        b_crimes = [c for c in crimes_db if c["district"] == "Bengaluru City"]
        cyber = len([c for c in b_crimes if c["crime_type"] == "Cybercrime"])
        theft = len([c for c in b_crimes if c["crime_type"] == "Theft"])
        total = len(b_crimes)
        
        if is_kannada:
            response_content = f"### ಬೆಂಗಳೂರು ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ\n\nಬೆಂಗಳೂರು ನಗರ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಒಟ್ಟು **{total}** ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ:\n\n* **ಸೈಬರ್ ಅಪರಾಧ (Cybercrime):** {cyber} ಪ್ರಕರಣಗಳು\n* **ಕಳ್ಳತನ (Theft):** {theft} ಪ್ರಕರಣಗಳು\n\n**ಮುನ್ನೆಚ್ಚರಿಕೆ:** ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ ಮತ್ತು ಕೋರಮಂಗಲ ಸೈಬರ್ ಅಪರಾಧದ ಪ್ರಮುಖ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳಾಗಿವೆ."
            suggestions = ["ಸೈಬರ್ ಅಪರಾಧ ತಡೆಗಟ್ಟುವುದು ಹೇಗೆ?", "ರವಿ ಕುಮಾರ್ ಯಾರು?"]
        else:
            response_content = f"### Bengaluru Crime Analysis\n\nOur system found a total of **{total}** recorded incidents in Bengaluru City:\n\n* **Cybercrime:** {cyber} cases\n* **Theft:** {theft} cases\n* **Other categories:** {total - cyber - theft} cases\n\n**Hotspot Warning:** Koramangala and Indiranagar report high densities of Cybercrime and Theft."
            suggestions = ["Show cybercrime hotspots in Bengaluru", "Identify top suspect in Bengaluru"]
        add_audit_log(role, "Database Query Execution", "Fetched Bengaluru crime statistics", sql)

    elif any(name in msg for name in ["ravi", "kumar", "cat ravi", "ರವಿ"]):
        thoughts.append("Searching suspect database for token: 'Ravi'.")
        sql = "SELECT * FROM suspects WHERE id = 'S101';"
        relatives = [l for l in network_links if l["source"] == "S101" or l["target"] == "S101"]
        links_str = "\n".join([f"- **{l['target'] if l['source']=='S101' else l['source']}** ({l['type']}): {l['details']}" for l in relatives])
        
        if is_kannada:
            response_content = f"### ಶಂಕಿತರ ವಿವರ: ರವಿ ಕುಮಾರ್ (ಕ್ಯಾಟ್ ರವಿ)\n\n* **ವಯಸ್ಸು:** 34 ವರ್ಷ\n* **ಅಪರಾಧ ವಿಭಾಗ:** ಕಳ್ಳತನ (Theft)\n* **ಸ್ಥಿತಿ:** ಸಕ್ರಿಯ (Active)\n* **ಅಪಾಯದ ಅಂಕ (Risk Score):** 85/100\n* **ವಾಹನ ಸಂಖ್ಯೆ:** KA-01-MJ-2041\n\n**ಕ್ರಿಮಿನಲ್ ನೆಟ್‌ವರ್ಕ್ ಕೊಂಡಿಗಳು:**\n{links_str}"
            suggestions = ["ರವಿ ಕುಮಾರ್ ಕೊನೆಯದಾಗಿ ಎಲ್ಲಿ ಪತ್ತೆಯಾಗಿದ್ದಾನೆ?", "ಮಂಜು ಗೌಡ ಯಾರು?"]
        else:
            response_content = f"### Suspect Profile: Ravi Kumar (alias 'Cat Ravi')\n\n* **ID:** S101\n* **Age:** 34\n* **Primary Offense:** Theft\n* **Status:** Active\n* **Risk Index:** 85/100 (High Risk)\n* **Linked Assets:** Vehicle KA-01-MJ-2041, SBI Bank Account 3029103212\n\n**Direct Network Associations:**\n{links_str}\n\n**Explainable AI Audit Trail: Suspect is classified as high-risk due to active status, multiple linked heists, and recent ₹4,50,000 transaction with cybercriminal Vikram Singh (S103).**"
            suggestions = ["Visualize Ravi's complete gang network", "Show financial transaction audits for S101"]
        add_audit_log(role, "Database Query Execution", "Retrieved profile for Ravi Kumar (S101)", sql)

    elif any(kw in msg for kw in ["victim", "victims", "affected", "complainant", "ಸಂತ್ರಸ್ತ", "ಬಾಧಿತ"]):
        thoughts.append("Detecting victim-centric query.")
        thoughts.append("Joining victims table with FIR and suspects tables.")
        sql = "SELECT v.*, s.name AS suspect_name FROM victims v LEFT JOIN suspects s ON v.suspect_id = s.id;"
        total_loss = sum(v["loss_amount"] for v in victims_db)
        female_count = len([v for v in victims_db if v["gender"] == "Female"])
        senior_count = len([v for v in victims_db if v["age"] >= 60])
        cyber_victims = len([v for v in victims_db if v["crime_type"] == "Cybercrime"])
        
        victim_lines = "\n".join([f"| {v['id']} | {v['name']} ({v['age']}, {v['gender']}) | {v['crime_type']} | {v['fir_no']} | ₹{v['loss_amount']:,} | {v['status']} |" for v in victims_db])
        
        if is_kannada:
            response_content = f"### ಸಂತ್ರಸ್ತರ ವಿಶ್ಲೇಷಣೆ \n\nವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಒಟ್ಟು **{len(victims_db)}** ಸಂತ್ರಸ್ತರ ದಾಖಲೆ ಇದೆ:\n\n* **ಒಟ್ಟು ಆರ್ಥಿಕ ನಷ್ಟ:** ₹{total_loss:,}\n* **ಮಹಿಳಾ ಸಂತ್ರಸ್ತರು:** {female_count}\n* **ಹಿರಿಯ ನಾಗರಿಕ ಸಂತ್ರಸ್ತರು (60+):** {senior_count}\n* **ಸೈಬರ್ ಅಪರಾಧ ಸಂತ್ರಸ್ತರು:** {cyber_victims}\n\n**ಪ್ರಮುಖ ಗಮನ:** ಮಹಿಳೆಯರು ಮತ್ತು ಹಿರಿಯ ನಾಗರಿಕರು ಹೆಚ್ಚು ಗುರಿಯಾಗುತ್ತಿದ್ದಾರೆ."
            suggestions = ["ಸಂತ್ರಸ್ತರ ಸಂಪೂರ್ಣ ಪಟ್ಟಿ", "ಸೈಬರ್ ಅಪರಾಧ ಸಂತ್ರಸ್ತರು"]
        else:
            response_content = f"### Victim Profile Analysis\n\nThe database contains **{len(victims_db)} registered victims** across Karnataka:\n\n| ID | Name & Demographics | Crime Type | FIR No. | Financial Loss | Status |\n|-----|---------------------|------------|---------|----------------|--------|\n{victim_lines}\n\n**📊 Vulnerability Summary:**\n* Total Recorded Financial Loss: **₹{total_loss:,}**\n* Female Victims: **{female_count}** (prioritized for victim support cell)\n* Senior Citizens (60+): **{senior_count}** (heightened protection protocol)\n* Cybercrime Victims: **{cyber_victims}** (digital awareness program flagged)\n\n*Explainable AI: Victim profiles correlated with suspect MOs to identify repeat targeting patterns.*"
            suggestions = ["Show victims of S103 (Vikram Singh)", "List senior citizen victims", "Victim support case status"]
        add_audit_log(role, "Database Query Execution", "Fetched victim profiles and vulnerability analysis", sql)

    else:
        thoughts.append("General help response triggered.")
        if is_kannada:
            response_content = f"ನಮಸ್ಕಾರ! ನಾನು ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ಅಪರಾಧ ಡೇಟಾಬೇಸ್‌ನ ಸಹಾಯಕಿ.\n\nಯುಪಿಐ ಹರಿವುಗಳು, ಅಂತರರಾಜ್ಯ ನೆಟ್‌ವರ್ಕ್‌ಗಳು ಅಥವಾ ಜನಸಂಖ್ಯಾ ಸೂಚಕಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು ನನ್ನನ್ನು ಕೇಳಿ:\n* **ಯುಪಿಐ ಹಣಕಾಸು ವಹಿವಾಟು ತೋರಿಸು.**\n* **ಅಂತರರಾಜ್ಯ ಗಡಿ ನೆಟ್‌ವರ್ಕ್ ವಿವರ.**\n* **ನಿರುದ್ಯೋಗ ಮತ್ತು ಅಪರಾಧದ ಲಿಂಕ್ ಏನು?**"
            suggestions = ["ಯುಪಿಐ ವಹಿವಾಟುಗಳು", "ಅಂತರರಾಜ್ಯ ಗಡಿ ಜಾಲ"]
        else:
            response_content = f"Welcome, **{role}**! I am the KSP Intelligent Assistant.\n\nHere are some operations you can execute via natural language queries:\n* **\"Show UPI transaction link trails\"**\n* **\"Analyze interstate crime alerts\"**\n* **\"Correlate unemployment and crime patterns\"**"
            suggestions = ["Show UPI money trails", "List interstate alerts", "Compare literacy and crime index"]

    return jsonify({
        "role": "model",
        "content": response_content,
        "thoughts": "\n".join(thoughts),
        "suggestions": suggestions,
        "sql": sql,
        "victim_count": len(victims_db)
    })


# --- Zoho Catalyst Advanced I/O Main Entry Point ---
def handler(request: Request):
    """
    Adapts Catalyst's incoming Flask request object into Flask's route matching system,
    runs the route, and returns the Flask response.
    """
    # Create request context
    with app.request_context(request.environ):
        try:
            # Route request in Flask application
            response = app.full_dispatch_request()
            return response
        except Exception as e:
            logging.error(f"Error handling request: {e}")
            return make_response(jsonify({"success": False, "error": str(e)}), 500)
