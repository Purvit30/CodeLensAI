const navItems = document.querySelectorAll(".admin-nav-item")
const views = {
  overview: document.getElementById("view-overview"),
  users: document.getElementById("view-users"),
  reports: document.getElementById("view-reports"),
  settings: document.getElementById("view-settings"),
}

function showView(id){
  Object.keys(views).forEach(k=>{ views[k].hidden = k!==id })
  navItems.forEach(b=> b.classList.toggle("active", b.dataset.view===id))
}

navItems.forEach(b=> b.addEventListener("click", ()=> showView(b.dataset.view)))

function renderStats(){
  const users = CodeLensAuth.getUsers()
  const reports = typeof CodeLensAuth.getReports==="function" ? CodeLensAuth.getReports() : (JSON.parse(localStorage.getItem("codelens.reports")||"[]"))
  document.getElementById("stat-users").textContent = String(users.length)
  document.getElementById("stat-reports").textContent = String(reports.length)
  const blocked = users.filter(u=> !!u.blocked).length
  document.getElementById("stat-blocked").textContent = String(blocked)
}

function el(tag, attrs, children){
  const e = document.createElement(tag)
  if (attrs) Object.entries(attrs).forEach(([k,v])=> e.setAttribute(k, String(v)))
  if (children) children.forEach(c=> {
    if (typeof c === "string") e.appendChild(document.createTextNode(c))
    else if (c) e.appendChild(c)
  })
  return e
}

function renderUsers(){
  const body = document.getElementById("users-body")
  body.innerHTML = ""
  const list = CodeLensAuth.getUsers()
  list.forEach(u=>{
    const tr = el("tr", null, [])
    tr.appendChild(el("td", null, [u.name||""]))
    tr.appendChild(el("td", null, [u.email||""]))
    tr.appendChild(el("td", null, [u.role||"user"]))
    tr.appendChild(el("td", null, [u.blocked?"Blocked":"Active"]))
    const actionsTd = el("td", null, [])
    const btnBlock = el("button", { class: u.blocked ? "btn-outline" : "danger" }, [u.blocked?"Unblock":"Block"])
    btnBlock.addEventListener("click", ()=>{
      CodeLensAuth.setUserBlocked(u.email||"", !u.blocked)
      CodeLensAuth.addAudit(u.blocked?"admin_unblock_user":"admin_block_user", { email:u.email })
      renderUsers(); renderStats()
    })
    const btnDel = el("button", { class: "btn-outline" }, ["Delete"])
    btnDel.addEventListener("click", ()=>{
      CodeLensAuth.deleteUser(u.email||"")
      CodeLensAuth.addAudit("admin_delete_user", { email:u.email })
      renderUsers(); renderStats()
    })
    const btnAdmin = el("button", { class: "btn-outline" }, ["Toggle Admin"])
    btnAdmin.addEventListener("click", ()=>{
      const role = (u.role||"") === "admin" ? "user" : "admin"
      CodeLensAuth.setUserRole(u.email||"", role)
      CodeLensAuth.addAudit("admin_set_role", { email:u.email, role })
      renderUsers(); renderStats()
    })
    actionsTd.appendChild(btnBlock)
    actionsTd.appendChild(btnDel)
    actionsTd.appendChild(btnAdmin)
    tr.appendChild(actionsTd)
    body.appendChild(tr)
  })
}

function summarizeText(t){
  const s = (t||"").split(/\r?\n/)[0]||""
  return s.length>80 ? s.slice(0,77)+"…" : s
}

function renderReports(){
  const body = document.getElementById("reports-body")
  body.innerHTML = ""
  const list = typeof CodeLensAuth.getReports==="function" ? CodeLensAuth.getReports() : (JSON.parse(localStorage.getItem("codelens.reports")||"[]"))
  list.forEach((r,idx)=>{
    const tr = el("tr", null, [])
    const who = r.user && (r.user.name||r.user.email||"") || "Anonymous"
    tr.appendChild(el("td", null, [who]))
    tr.appendChild(el("td", null, [summarizeText(r.text||"")]))
    tr.appendChild(el("td", null, [r.status||"Open"]))
    const actionsTd = el("td", null, [])
    const btnView = el("button", { class:"btn-outline" }, ["View"])
    btnView.addEventListener("click", ()=>{
      alert(r.text||"")
    })
    const btnResolve = el("button", { class:"btn-outline" }, ["Mark Resolved"])
    btnResolve.addEventListener("click", ()=>{
      if (typeof CodeLensAuth.updateReportStatus==="function"){ 
        CodeLensAuth.updateReportStatus(idx, "Resolved")
      } else {
        const arr = list.slice(); if (arr[idx]) arr[idx].status="Resolved"; localStorage.setItem("codelens.reports", JSON.stringify(arr))
      }
      if (typeof CodeLensAuth.addAudit==="function") CodeLensAuth.addAudit("admin_resolve_report", { idx })
      renderReports()
    })
    const btnDelete = el("button", { class:"danger" }, ["Delete"])
    btnDelete.addEventListener("click", ()=>{
      if (typeof CodeLensAuth.deleteReport==="function"){
        CodeLensAuth.deleteReport(idx)
      } else {
        const arr = list.filter((_,i)=> i!==idx); localStorage.setItem("codelens.reports", JSON.stringify(arr))
      }
      if (typeof CodeLensAuth.addAudit==="function") CodeLensAuth.addAudit("admin_delete_report", { idx })
      renderReports(); renderStats()
    })
    actionsTd.appendChild(btnView)
    actionsTd.appendChild(btnResolve)
    actionsTd.appendChild(btnDelete)
    tr.appendChild(actionsTd)
    body.appendChild(tr)
  })
}

function renderAudit(){
  const elOut = document.getElementById("audit-log")
  const list = typeof CodeLensAuth.getAudit==="function" ? CodeLensAuth.getAudit() : (JSON.parse(localStorage.getItem("codelens.audit")||"[]"))
  const lines = list.map(x=>{
    const t = new Date(x.ts||Date.now()).toLocaleString()
    const who = x.user && (x.user.email||x.user.name||"") || "unknown"
    return `${t} • ${who} • ${x.action}`
  })
  elOut.textContent = lines.join("\n")
}

document.getElementById("btn-export").addEventListener("click", ()=>{
  const data = {
    users: CodeLensAuth.getUsers(),
    reports: CodeLensAuth.getReports(),
    audit: CodeLensAuth.getAudit()
  }
  const blob = new Blob([JSON.stringify(data,null,2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "codelens-admin-export.json"
  a.click()
  URL.revokeObjectURL(url)
})

document.getElementById("btn-clear-audit").addEventListener("click", ()=>{
  localStorage.setItem("codelens.audit", "[]")
  renderAudit()
})
document.getElementById("btn-logout-admin").addEventListener("click", ()=>{ CodeLensAuth.logout() })

renderStats()
renderUsers()
renderReports()
renderAudit()
showView("overview")

;(function guard(){
  const cfg = window.CodeLensConfig || {}
  const adminEmail = (cfg.adminEmail||"").toLowerCase()
  const u = CodeLensAuth.getUser()
  const ok = !!u && ((u.role||"")==="admin" || (!!adminEmail && (u.email||"").toLowerCase()===adminEmail))
  if (!ok) window.location.href = "admin-login.html"
})()
