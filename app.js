const input = document.getElementById("code-input")
const output = document.getElementById("output")
const btnExplain = document.getElementById("btn-explain")
const btnRun = document.getElementById("btn-run")
const btnErrors = document.getElementById("btn-errors")
const runtimeOutput = document.getElementById("runtime-output")
const btnFlow = document.getElementById("btn-flow")
const btnOptimize = document.getElementById("btn-optimize")
const btnClear = document.getElementById("btn-clear")
const langSelect = document.getElementById("lang-select")
const modeAdvanced = document.getElementById("mode-advanced")
const modeEli10 = document.getElementById("mode-eli10")
const editor = document.getElementById("editor")
const editorGutter = document.getElementById("editor-gutter")
const editorDark = document.getElementById("editor-dark")
const tabOutput = document.getElementById("tab-output")
const tabErrors = document.getElementById("tab-errors")
const tabLogs = document.getElementById("tab-logs")
let runtimeActiveTab = "output"
const runtimeData = { output: [], errors: [], logs: [] }
const terminalToggle = document.getElementById("terminal-toggle")
const tabsEl = document.getElementById("tabs")
let terminalCollapsed = false

function detectLanguage(code, override) {
  if (override) return override
  const c = code
  if (/^\s*<\?php/m.test(c) || /\$\w+\s*=/.test(c)) return "PHP"
  if (/def\s+\w+\s*\(/.test(c) || /import\s+\w+/.test(c) || /print\(/.test(c)) return "Python"
  if (/function\s+\w+\s*\(|=>/.test(c) || /console\.log/.test(c)) return "JavaScript"
  if (/public\s+class\s+\w+/.test(c) || /public\s+static\s+void\s+main/.test(c)) return "Java"
  if (/#include\s+<\w+>|int\s+main\s*\(/.test(c)) return "C"
  if (/#include\s+<\w+>|std::\w+|using\s+namespace/.test(c)) return "C++"
  if (/package\s+main/.test(c) || /func\s+\w+\s*\(/.test(c)) return "Go"
  if (/^\s*def\s+\w+.*end\s*$/m.test(c) || /\s+end\s*$/.test(c)) return "Ruby"
  if (/type\s+\w+\s*=/.test(c) || /interface\s+\w+/.test(c)) return "TypeScript"
  return "Unknown"
}

function summarize(code, lang) {
  const lines = code.trim().split(/\r?\n/)
  if (!lines.length || !code.trim()) return "No code provided."
  const headline = lines[0].trim()
  const total = lines.length
  const hasFunc = /def\s+|function\s+|=>\s*|func\s+|public\s+static\s+void\s+main|class\s+\w+/.test(code)
  const hasLoop = /\bfor\b|\bwhile\b|\bforeach\b|\brange\b/.test(code)
  const hasCond = /\bif\b|\bswitch\b|\belif\b|\belse if\b/.test(code)
  const parts = []
  parts.push(`Analyses ${lang} code (${total} lines) and focuses on its actual structure.`)
  if (headline) parts.push(`Starts with: "${headline.slice(0,80)}${headline.length>80?"…":""}"`)
  if (hasFunc) parts.push("Detects defined functions/classes and how they interact.")
  if (hasLoop) parts.push("Identifies loop constructs and their traversal patterns.")
  if (hasCond) parts.push("Explains conditional branches and decision logic.")
  return parts.join(" ")
}

function splitLines(code) {
  return code.split(/\r?\n/).map((t,i)=>({i:i+1,t}))
}

function extractEntities(code) {
  const vars = []
  const funcs = []
  const loops = []
  const conds = []
  const lines = splitLines(code)
  lines.forEach(l=>{
    const s = l.t
    let m
    m = s.match(/\b(const|let|var)\s+(\w+)\s*=|^\s*(\w+)\s*=\s*[^=]/)
    if (m) vars.push({name:m[2]||m[3], line:l.i})
    m = s.match(/\b(for|while|foreach)\b\s*\(?.*?\)?/)
    if (m) loops.push({type:m[1], line:l.i, text:s.trim()})
    m = s.match(/\b(if|else if|elif|switch)\b/)
    if (m) conds.push({type:m[1], line:l.i, text:s.trim()})
    m = s.match(/\bdef\s+(\w+)\s*\(|\bfunction\s+(\w+)\s*\(|\bfunc\s+(\w+)\s*\(|\bclass\s+(\w+)|\b(\w+)\s*=\s*\(.*?\)\s*=>/)
    if (m) {
      const name = m[1]||m[2]||m[3]||m[4]||m[5]
      funcs.push({name, line:l.i})
    }
  })
  return {vars, funcs, loops, conds, lines}
}

function buildStepByStep(code, entities, eli10) {
  const steps = []
  const add = (n, text) => steps.push(`${n}) ${text}`)
  add(1, "Scan inputs, imports, and initial declarations.")
  if (entities.vars.length) add(2, `Initialize variables: ${entities.vars.map(v=>`${v.name}@${v.line}`).slice(0,8).join(", ")}.`)
  if (entities.funcs.length) add(3, `Define functions/classes: ${entities.funcs.map(f=>`${f.name}@${f.line}`).slice(0,8).join(", ")}.`)
  if (entities.conds.length) add(4, `Branch logic with ${entities.conds.map(c=>c.type).join(", ")} at lines ${entities.conds.map(c=>c.line).join(", ")}.`)
  if (entities.loops.length) add(5, `Iterate using ${entities.loops.map(l=>l.type).join(", ")} at lines ${entities.loops.map(l=>l.line).join(", ")}.`)
  add(6, "Aggregate/return results and side-effects.")
  if (eli10) return steps.map(s=> s.replace(/^\d+\)\s*/, "") ).map(s=> "• "+s).join("\n")
  return steps.join("\n")
}

function buildKeyConcepts(entities, lang) {
  const concepts = []
  concepts.push("Variables")
  if (entities.funcs.length) concepts.push("Functions/Classes")
  if (entities.loops.length) concepts.push("Loops")
  if (entities.conds.length) concepts.push("Conditions")
  concepts.push("Inputs/Outputs")
  concepts.push(`${lang} syntax basics`)
  return concepts.join(", ")
}

function complexity(code, entities) {
  let depth = 0
  const stack = []
  entities.lines.forEach(l=>{
    if (/\bfor\b|\bwhile\b/.test(l.t)) { stack.push("loop"); if (stack.length>depth) depth=stack.length }
    if (/\{/.test(l.t)) stack.push("{")
    if (/\}/.test(l.t) && stack.length) stack.pop()
  })
  let comp = "O(1)"
  if (entities.loops.length===1) comp = "O(n)"
  if (entities.loops.length>1 || depth>=2) comp = "O(n^2)"
  if (/recurs|self|def\s+\w+\s*\(.*\).*\n.*\1\(/s.test(code)) comp = "O(n) or higher (recursion)"
  return comp
}

function errorsAndImprovements(code, lang) {
  const issues = []
  if (!code.trim()) issues.push("No code provided.")
  if (/console\.log\(.+\)\s*;?\s*$/.test(code) && !/try/.test(code)) issues.push("Consider structured logging or removing debug logs.")
  if (/print\(.+\)/.test(code) && /def\s+/.test(code)) issues.push("Return values instead of printing inside functions when appropriate.")
  if (/var\s+\w+/.test(code)) issues.push("Prefer let/const over var in modern JavaScript.")
  if (/==\s*null/.test(code)) issues.push("Use strict equality checks where applicable.")
  if (/^\s*$/.test(code.split(/\r?\n/)[0]||"")) issues.push("Trim leading blank lines.")
  const tips = []
  tips.push("Use meaningful variable names.")
  tips.push("Break long functions into smaller helpers.")
  tips.push("Add input validation and error handling.")
  tips.push("Write small unit tests for key logic.")
  return {issues, tips}
}

function visualFlow(entities) {
  const items = []
  items.push("Start")
  if (entities.vars.length) items.push("Setup variables")
  if (entities.funcs.length) items.push("Define functions/classes")
  if (entities.conds.length) items.push("Check conditions")
  if (entities.loops.length) items.push("Loop over data")
  items.push("Produce result")
  items.push("End")
  return items.map((x,i)=> i===items.length-1 ? x : x+" → ").join("")
}

function exampleIO(lang) {
  if (lang==="Python") return {input:"[1,2,3]", output:"Processed list of 3 items"}
  if (lang==="JavaScript") return {input:"[1,2,3]", output:"Array processed"}
  if (lang==="Java") return {input:"3", output:"Computed result"}
  if (lang==="Go") return {input:"3", output:"Computed result"}
  if (lang==="C"||lang==="C++") return {input:"n=3", output:"Computed result"}
  return {input:"sample", output:"result"}
}

function difficulty(entities) {
  const lines = entities.lines.length
  const score = (entities.funcs.length?2:0)+(entities.loops.length?2:0)+(entities.conds.length?1:0)+(lines>40?2:0)
  if (score<=2) return "Easy"
  if (score<=4) return "Medium"
  return "Hard"
}

function formatOutput(lang, summary, stepByStep, concepts, improvements, comp, flow, eli10, advanced, entities) {
  const sections = []
  sections.push("LANGUAGE:\n"+lang+"\n")
  sections.push("SUMMARY:\n"+summary+"\n")
  sections.push("STEP-BY-STEP EXPLANATION:\n"+stepByStep+"\n")
  sections.push("KEY CONCEPTS:\n"+concepts+"\n")
  const impLines = []
  if (improvements.issues.length) impLines.push("Issues: "+improvements.issues.join("; "))
  impLines.push("Optimization Suggestions: "+improvements.tips.join("; "))
  impLines.push("Time Complexity: "+comp)
  const ex = exampleIO(lang)
  impLines.push("Example Input/Output: input="+ex.input+" → output="+ex.output)
  impLines.push("Estimated Difficulty: "+difficulty(entities))
  sections.push("OPTIMIZATION & ANALYSIS:\n"+impLines.join("\n")+"\n")
  sections.push("VISUAL FLOW:\n"+flow+"\n")
  if (eli10) sections.push("BEGINNER MODE:\nFocuses on simple, high-level explanations.\n")
  if (advanced) sections.push("TECHNICAL MODE:\nIncludes structure, complexity and code-specific insights.\n")
  return sections.join("\n")
}

function runInSandboxJS(code) {
  runtimeData.output = []
  runtimeData.errors = []
  runtimeData.logs = []
  updateRuntimeView()
  const iframe = document.createElement("iframe")
  iframe.setAttribute("sandbox","allow-scripts")
  iframe.style.display = "none"
  document.body.appendChild(iframe)
  const script = `
    <script>
      (function(){
        function post(type, msg){ parent.postMessage({ type, msg }, "*") }
        const origLog = console.log, origErr = console.error
        console.log = function(){ try { post("log", Array.from(arguments).join(" ")) } catch(e){}; origLog.apply(console, arguments) }
        console.error = function(){ try { post("error", Array.from(arguments).join(" ")) } catch(e){}; origErr.apply(console, arguments) }
        window.onerror = function(message, source, lineno, colno, error){ post("error", String(message)) }
        try {
          ${code}
        } catch(e) {
          post("error", String(e && e.message ? e.message : e))
        }
        post("done","Execution finished")
      })();
    <\/script>
  `
  const html = "<!doctype html><html><head><meta charset='utf-8'></head><body>"+script+"</body></html>"
  iframe.srcdoc = html
  const timeout = setTimeout(()=> {
    try { document.body.removeChild(iframe) } catch {}
    appendRuntime("errors","Terminated after 3s (possible infinite loop).")
  }, 3000)
  function handle(e){
    const d = e.data || {}
    if (!d || !d.type) return
    if (d.type==="log") appendRuntime("logs", d.msg)
    else if (d.type==="error") appendRuntime("errors", d.msg)
    else appendRuntime("output", d.msg)
    if (d.type==="done"){
      try { document.body.removeChild(iframe) } catch {}
      clearTimeout(timeout)
      window.removeEventListener("message", handle)
    }
  }
  window.addEventListener("message", handle)
}

function appendRuntime(kind, msg){
  const line = String(msg||"")
  runtimeData[kind].push(line)
  updateRuntimeView()
}

function showErrors(){
  const code = input.value
  const override = langSelect.value||""
  const lang = detectLanguage(code, override)
  const result = errorsAndImprovements(code, lang)
  const issues = result.issues.length ? result.issues : ["No obvious issues detected."]
  runtimeData.errors = issues
  runtimeActiveTab = "errors"
  updateRuntimeView()
}

function runExplain(showFlowOnly, optimizeOnly) {
  const code = input.value
  const override = langSelect.value||""
  const lang = detectLanguage(code, override)
  if (!code.trim()) {
    output.textContent = "Please paste valid code."
    return
  }
  btnExplain.classList.add("btn-loading")
  btnExplain.innerHTML = '<span class="spinner"></span>Explain Code'
  const entities = extractEntities(code)
  const summaryText = summarize(code, lang)
  const step = buildStepByStep(code, entities, modeEli10.checked)
  const concepts = buildKeyConcepts(entities, lang)
  const comp = complexity(code, entities)
  const improvements = errorsAndImprovements(code, lang)
  const flow = visualFlow(entities)
  if (showFlowOnly) {
    output.textContent = "VISUAL FLOW:\n"+flow
    btnExplain.classList.remove("btn-loading")
    btnExplain.innerHTML = 'Explain Code'
    return
  }
  if (optimizeOnly) {
    const tips = improvements.tips.join("\n")
    output.textContent = "OPTIMIZE CODE SUGGESTIONS:\n"+tips
    btnExplain.classList.remove("btn-loading")
    btnExplain.innerHTML = 'Explain Code'
    return
  }
  const text = formatOutput(lang, summaryText, step, concepts, improvements, comp, flow, modeEli10.checked, modeAdvanced.checked, entities)
  output.textContent = text
  btnExplain.classList.remove("btn-loading")
  btnExplain.innerHTML = 'Explain Code'
}

btnExplain && btnExplain.addEventListener("click", ()=> runExplain(false,false))
btnErrors && btnErrors.addEventListener("click", showErrors)
btnFlow && btnFlow.addEventListener("click", ()=> runExplain(true,false))
btnOptimize && btnOptimize.addEventListener("click", ()=> runExplain(false,true))
btnClear && btnClear.addEventListener("click", ()=> { input.value=""; output.textContent="" })
btnRun && btnRun.addEventListener("click", runCode)

function updateRuntimeView(){
  const data = runtimeData[runtimeActiveTab]
  runtimeOutput.textContent = data.join("\n")
  tabOutput.classList.toggle("active", runtimeActiveTab==="output")
  tabErrors.classList.toggle("active", runtimeActiveTab==="errors")
  tabLogs.classList.toggle("active", runtimeActiveTab==="logs")
  tabOutput.setAttribute("aria-selected", String(runtimeActiveTab==="output"))
  tabErrors.setAttribute("aria-selected", String(runtimeActiveTab==="errors"))
  tabLogs.setAttribute("aria-selected", String(runtimeActiveTab==="logs"))
}
tabOutput.addEventListener("click", ()=>{ runtimeActiveTab="output"; updateRuntimeView() })
tabErrors.addEventListener("click", ()=>{ runtimeActiveTab="errors"; updateRuntimeView() })
tabLogs.addEventListener("click", ()=>{ runtimeActiveTab="logs"; updateRuntimeView() })

function updateLineNumbers(){
  const lines = input.value.split(/\r?\n/).length || 1
  let html = ""
  for (let i=1;i<=lines;i++){ html += i+"<br>" }
  editorGutter.innerHTML = html
}
input.addEventListener("input", updateLineNumbers)
updateLineNumbers()
editorDark.addEventListener("change", ()=> {
  editor.classList.toggle("dark", editorDark.checked)
})

function startRunLoading(){
  btnRun.classList.add("btn-loading")
  btnRun.innerHTML = '<span class="spinner"></span>Run Code'
}
function stopRunLoading(){
  btnRun.classList.remove("btn-loading")
  btnRun.textContent = "Run Code"
}

function runCode(){
  const code = input.value
  const override = langSelect.value||""
  const lang = detectLanguage(code, override)
  if (!code.trim()){
    runtimeData.output = ["Paste code to run."]
    runtimeActiveTab = "output"
    updateRuntimeView()
    return
  }
  startRunLoading()
  if (lang === "JavaScript") {
    runInSandboxJS(code)
  } else if (lang === "TypeScript") {
    runInTypeScript(code)
  } else if (lang === "Python") {
    runInPython(code)
  } else if (lang === "Ruby") {
    runInRuby(code)
  } else {
    runtimeData.errors = ["Runner is not available for "+lang+" yet."]
    runtimeActiveTab = "errors"
    updateRuntimeView()
  }
  stopRunLoading()
}



function runInTypeScript(code){
  try {
    const js = window.ts && ts.transpile ? ts.transpile(code, { target: 99 }) : null
    if (!js) {
      runtimeData.errors = ["TypeScript compiler not loaded."]
      runtimeActiveTab = "errors"
      updateRuntimeView()
      return
    }
    runInSandboxJS(js)
  } catch(e){
    appendRuntime("errors", String(e && e.message ? e.message : e))
  }
}

function pyBuiltinRead(x){
  if (typeof Sk === "undefined" || !Sk.builtinFiles || !Sk.builtinFiles["files"][x]) throw "File not found: "+x
  return Sk.builtinFiles["files"][x]
}
function runInPython(code){
  if (typeof Sk === "undefined"){
    runtimeData.errors = ["Python runtime not loaded."]
    runtimeActiveTab = "errors"
    updateRuntimeView()
    return
  }
  runtimeData.output = []
  runtimeData.errors = []
  runtimeData.logs = []
  updateRuntimeView()
  Sk.configure({ 
    output: function(text){ appendRuntime("output", text) }, 
    read: pyBuiltinRead, 
    __future__: Sk.python3 
  })
  try {
    const p = Sk.misceval.asyncToPromise(function(){ return Sk.importMainWithBody("<stdin>", false, code, true) })
    p.then(function(){ appendRuntime("output","Execution finished") })
     .catch(function(err){ appendRuntime("errors", String(err)) })
  } catch(e){
    appendRuntime("errors", String(e))
  }
}

function runInRuby(code){
  try {
    if (typeof Opal === "undefined"){
      runtimeData.errors = ["Ruby runtime not loaded."]
      runtimeActiveTab = "errors"
      updateRuntimeView()
      return
    }
    const js = Opal.compile(code)
    runInSandboxJS(js)
  } catch(e){
    appendRuntime("errors", String(e && e.message ? e.message : e))
  }
}

let touchStartX = 0, touchStartY = 0
runtimeOutput.addEventListener("touchstart", function(e){
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  touchStartX = t.clientX
  touchStartY = t.clientY
}, { passive: true })
runtimeOutput.addEventListener("touchend", function(e){
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  if (Math.abs(dx) > 40 && Math.abs(dy) < 30){
    if (dx < 0) {
      if (runtimeActiveTab==="output") runtimeActiveTab="errors"
      else if (runtimeActiveTab==="errors") runtimeActiveTab="logs"
    } else {
      if (runtimeActiveTab==="logs") runtimeActiveTab="errors"
      else if (runtimeActiveTab==="errors") runtimeActiveTab="output"
    }
    updateRuntimeView()
  }
}, { passive: true })

terminalToggle.addEventListener("click", function(){
  terminalCollapsed = !terminalCollapsed
  terminalToggle.textContent = terminalCollapsed ? "Show Output" : "Hide Output"
  terminalToggle.setAttribute("aria-expanded", String(!terminalCollapsed))
  tabsEl.style.display = terminalCollapsed ? "none" : ""
  runtimeOutput.style.display = terminalCollapsed ? "none" : ""
})
