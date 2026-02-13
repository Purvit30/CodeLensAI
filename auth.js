const storageKey = "codelens.user"
const usersKey = "codelens.users"
const reportsKey = "codelens.reports"
const auditKey = "codelens.audit"
function getUser(){ try { return JSON.parse(localStorage.getItem(storageKey)||"null") } catch { return null } }
function setUser(u){ localStorage.setItem(storageKey, JSON.stringify(u)) }
function clearUser(){ localStorage.removeItem(storageKey) }
function requireAuth(){ 
  const u = getUser(); 
  if(!u) { window.location.href = "login.html"; return }
  if (u && u.blocked) { clearUser(); window.location.href = "login.html"; return }
}
function logout(){ clearUser(); window.location.href = "login.html" }
function getUsers(){ try { return JSON.parse(localStorage.getItem(usersKey)||"[]") } catch { return [] } }
function saveUsers(arr){ localStorage.setItem(usersKey, JSON.stringify(arr)) }
function addUser(u){
  const arr = getUsers()
  const idx = arr.findIndex(x=> (x.email||"").toLowerCase() === (u.email||"").toLowerCase())
  if (idx>=0) arr[idx] = u; else arr.push(u)
  saveUsers(arr)
}
function findUserByEmail(email){
  const arr = getUsers()
  return arr.find(x=> (x.email||"").toLowerCase() === (email||"").toLowerCase()) || null
}
function setUserBlocked(email, blocked){
  const arr = getUsers()
  const idx = arr.findIndex(x=> (x.email||"").toLowerCase() === (email||"").toLowerCase())
  if (idx>=0){ arr[idx].blocked = !!blocked; saveUsers(arr) }
}
function deleteUser(email){
  const arr = getUsers().filter(x=> (x.email||"").toLowerCase() !== (email||"").toLowerCase())
  saveUsers(arr)
}
function setUserRole(email, role){
  const arr = getUsers()
  const idx = arr.findIndex(x=> (x.email||"").toLowerCase() === (email||"").toLowerCase())
  if (idx>=0){ arr[idx].role = role; saveUsers(arr) }
}
function isAdmin(u){
  const cfg = window.CodeLensConfig || {}
  const adminEmail = (cfg.adminEmail||"").toLowerCase()
  if (!u) return false
  if ((u.role||"")==="admin") return true
  if (adminEmail && (u.email||"").toLowerCase()===adminEmail) return true
  return false
}
function requireAdmin(){
  const u = getUser()
  if (!u || !isAdmin(u)) { window.location.href = "admin-login.html"; return }
}
function getReports(){ try { return JSON.parse(localStorage.getItem(reportsKey)||"[]") } catch { return [] } }
function saveReports(arr){ localStorage.setItem(reportsKey, JSON.stringify(arr)) }
function updateReportStatus(idx, status){
  const arr = getReports()
  if (arr[idx]){ arr[idx].status = status; saveReports(arr) }
}
function deleteReport(idx){
  const arr = getReports()
  const next = arr.filter((_,i)=> i!==idx)
  saveReports(next)
}
function addAudit(action, details){
  try {
    const arr = JSON.parse(localStorage.getItem(auditKey)||"[]")
    arr.push({ action, details, user: getUser(), ts: Date.now() })
    localStorage.setItem(auditKey, JSON.stringify(arr))
  } catch {}
}
function getAudit(){ try { return JSON.parse(localStorage.getItem(auditKey)||"[]") } catch { return [] } }
window.CodeLensAuth = { 
  getUser, setUser, clearUser, requireAuth, logout, 
  getUsers, saveUsers, addUser, findUserByEmail, 
  setUserBlocked, deleteUser, setUserRole, isAdmin, requireAdmin,
  getReports, saveReports, updateReportStatus, deleteReport,
  addAudit, getAudit
}
