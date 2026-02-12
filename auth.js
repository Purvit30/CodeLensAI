const storageKey = "codelens.user"
const usersKey = "codelens.users"
function getUser(){ try { return JSON.parse(localStorage.getItem(storageKey)||"null") } catch { return null } }
function setUser(u){ localStorage.setItem(storageKey, JSON.stringify(u)) }
function clearUser(){ localStorage.removeItem(storageKey) }
function requireAuth(){ const u = getUser(); if(!u) window.location.href = "login.html" }
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
window.CodeLensAuth = { getUser, setUser, clearUser, requireAuth, logout, getUsers, addUser, findUserByEmail }
