const adminEmailInput = document.getElementById("admin-email")
const adminPassInput = document.getElementById("admin-pass")
const adminLoginBtn = document.getElementById("admin-login-btn")
const backBtn = document.getElementById("back-btn")
const adminLoginMsg = document.getElementById("admin-login-msg")
const adminEmailErr = document.getElementById("admin-email-err")
const adminPassErr = document.getElementById("admin-pass-err")

function setErr(el, errEl, msg){
  el && el.setAttribute("aria-invalid", msg ? "true" : "false")
  const parent = el && el.closest(".input-field")
  if (parent) parent.classList.toggle("has-error", !!msg)
  if (errEl) errEl.textContent = msg || ""
}

function validEmail(e){
  const r = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return r.test((e||"").trim())
}
function normalize(s){ return (s||"").trim().toLowerCase() }

async function hashPassword(p){
  const enc = new TextEncoder().encode(p||"")
  const buf = await crypto.subtle.digest("SHA-256", enc)
  const bytes = Array.from(new Uint8Array(buf))
  return bytes.map(b=>b.toString(16).padStart(2,"0")).join("")
}

backBtn.addEventListener("click", ()=>{ window.location.href = "index.html" })

adminLoginBtn.addEventListener("click", async ()=>{
  const e = (adminEmailInput.value||"").trim()
  const p = adminPassInput.value||""
  let hasErr = false
  if(!e){ setErr(adminEmailInput, adminEmailErr, "Enter admin email or name."); hasErr = true }
  if(!p){ setErr(adminPassInput, adminPassErr, "Enter the admin password."); hasErr = true }
  if (hasErr) return
  const cfg = window.CodeLensConfig || {}
  const adminEmail = normalize(cfg.adminEmail||"")
  const adminName = normalize(cfg.adminName||"")
  const adminPasswordHash = normalize(cfg.adminPasswordHash||"")
  if ((!adminEmail && !adminName) || !adminPasswordHash){ adminLoginMsg.textContent = "Admin credentials are not configured."; return }
  const idNorm = normalize(e)
  const okId = (adminEmail && idNorm===adminEmail) || (adminName && idNorm===adminName)
  const ph = await hashPassword(p)
  const okPass = normalize(ph) === adminPasswordHash
  if (!okId || !okPass){
    setErr(adminEmailInput, adminEmailErr, okId? "" : "Incorrect admin email or name.")
    setErr(adminPassInput, adminPassErr, okPass? "" : "Incorrect admin password.")
    adminLoginMsg.textContent = "Authorization failed."
    return
  }
  CodeLensAuth.setUser({ provider:"admin", role:"admin", email: validEmail(e)?e:"", name: cfg.adminName||"Admin", createdAt: Date.now() })
  CodeLensAuth.addAudit("admin_login", { email:e })
  window.location.href = "admin.html"
})

adminEmailInput.addEventListener("input", ()=> setErr(adminEmailInput, adminEmailErr, ""))
adminPassInput.addEventListener("input", ()=> setErr(adminPassInput, adminPassErr, ""))
