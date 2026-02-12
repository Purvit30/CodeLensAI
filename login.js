const nameInput = document.getElementById("name")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const btnSwitch = document.getElementById("btn-switch")
const btnPrimary = document.getElementById("btn-primary")
const btnGuest = document.getElementById("btn-guest")
const btnGithub = document.getElementById("btn-github")
const msg = document.getElementById("login-msg")
const nameErr = document.getElementById("name-err")
const emailErr = document.getElementById("email-err")
const passwordErr = document.getElementById("password-err")

let mode = "create"

function validEmail(e){
  const r = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return r.test((e||"").trim())
}
function validName(n){
  return (n||"").trim().length >= 2
}
function validPassword(p){
  return (p||"").length >= 6
}
async function hashPassword(p){
  const enc = new TextEncoder().encode(p)
  const buf = await crypto.subtle.digest("SHA-256", enc)
  const bytes = Array.from(new Uint8Array(buf))
  return bytes.map(b=>b.toString(16).padStart(2,"0")).join("")
}

function updateUI(){
  if (mode==="signin"){
    btnSwitch.textContent = "Switch to Create"
    btnPrimary.textContent = "Sign In"
  } else {
    btnSwitch.textContent = "Switch to Sign In"
    btnPrimary.textContent = "Create Account"
  }
}
updateUI()

function setError(el, errEl, message){
  el.setAttribute("aria-invalid", message ? "true" : "false")
  const parent = el.closest(".input-field")
  if (parent) parent.classList.toggle("has-error", !!message)
  if (errEl) errEl.textContent = message || ""
}

function startLoading(){
  btnPrimary.classList.add("btn-loading")
  btnPrimary.innerHTML = '<span class="spinner"></span>'+btnPrimary.textContent
}
function stopLoading(){
  btnPrimary.classList.remove("btn-loading")
  btnPrimary.innerHTML = btnPrimary.textContent
}

btnSwitch.addEventListener("click", ()=>{
  mode = mode==="create" ? "signin" : "create"
  updateUI()
})

btnGuest.addEventListener("click", ()=>{
  CodeLensAuth.setUser({ provider:"guest", name:"Guest", email:"", createdAt: Date.now() })
  window.location.href = "index.html"
})

btnGithub.addEventListener("click", ()=>{
  const cid = window.CodeLensConfig.githubClientId
  if(!cid){ msg.textContent = "GitHub login not configured."; return }
  const rd = window.location.origin + "/codelens/oauth.html"
  const u = "https://github.com/login/oauth/authorize?client_id="+encodeURIComponent(cid)+"&scope=read:user%20user:email&redirect_uri="+encodeURIComponent(rd)+"&allow_signup=true"
  window.location.href = u
})

btnPrimary.addEventListener("click", async ()=>{
  const n = (nameInput.value||"").trim()
  const e = (emailInput.value||"").trim()
  const p = passwordInput.value||""
  if (mode==="create"){
    let hasErr = false
    if(!validName(n)){ setError(nameInput, nameErr, "Enter your name (min 2 characters)."); hasErr = true }
    if(!validEmail(e)){ setError(emailInput, emailErr, "Enter a valid email address."); hasErr = true }
    if(!validPassword(p)){ setError(passwordInput, passwordErr, "Enter a password (min 6 characters)."); hasErr = true }
    if (hasErr) return
    startLoading()
    const ph = await hashPassword(p)
    CodeLensAuth.addUser({ name:n, email:e, passwordHash:ph, createdAt: Date.now() })
    CodeLensAuth.setUser({ provider:"user", name:n, email:e, createdAt: Date.now() })
    stopLoading()
    window.location.href = "index.html"
  } else {
    let hasErr = false
    if(!validEmail(e)){ setError(emailInput, emailErr, "Enter a valid email address."); hasErr = true }
    if(!validPassword(p)){ setError(passwordInput, passwordErr, "Enter your password."); hasErr = true }
    if (hasErr) return
    startLoading()
    const u = CodeLensAuth.findUserByEmail(e)
    if (!u){ stopLoading(); setError(emailInput, emailErr, "No account found for this email."); return }
    const ph = await hashPassword(p)
    if (u.passwordHash !== ph){ stopLoading(); setError(passwordInput, passwordErr, "Incorrect password."); return }
    CodeLensAuth.setUser({ provider:"user", name:u.name||"", email:e, createdAt: Date.now() })
    stopLoading()
    window.location.href = "index.html"
  }
})

nameInput.addEventListener("input", ()=> setError(nameInput, nameErr, ""))
emailInput.addEventListener("input", ()=> setError(emailInput, emailErr, ""))
passwordInput.addEventListener("input", ()=> setError(passwordInput, passwordErr, ""))
