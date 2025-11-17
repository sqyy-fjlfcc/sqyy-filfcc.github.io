// ---------------------------
// 简单的前端应用：localStorage 驱动
// 支持：两级密码、搜索、文件夹（新增/重命名/删除）、编辑文字、上传图片（base64）
// ---------------------------



// ====== 状态 ======
let canEdit = false;
let activeFolder = null;
let dataKey = "mySecureArchive_v1"; // localStorage key

// ====== DOM 元素 ======
const pwInput = document.getElementById("pw-input");
const pwBtn = document.getElementById("pw-btn");
const pwMsg = document.getElementById("pw-msg");

const mainUi = document.getElementById("main-ui");
const pwPanel = document.getElementById("pw-panel");

const folderListEl = document.getElementById("folder-list");
const addFolderBtn = document.getElementById("add-folder-btn");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resetSearchBtn = document.getElementById("reset-search");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");
const clearBtn = document.getElementById("clear-btn");

const emptyTip = document.getElementById("empty-tip");
const folderView = document.getElementById("folder-view");
const folderTitleEl = document.getElementById("folder-title");
const textDisplay = document.getElementById("text-display");
const imageDisplay = document.getElementById("image-display");

const editorSection = document.getElementById("editor");
const textInput = document.getElementById("text-input");
const imgInput = document.getElementById("img-input");
const addImgBtn = document.getElementById("add-img-btn");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const renameFolderBtn = document.getElementById("rename-folder-btn");
const deleteFolderBtn = document.getElementById("delete-folder-btn");

// ====== 数据操作 ======
function loadData(){
  try {
    return JSON.parse(localStorage.getItem(dataKey) || "{}");
  } catch(e){
    console.error("读取数据失败", e);
    return {};
  }
}
function saveData(obj){
  localStorage.setItem(dataKey, JSON.stringify(obj));
}

// 初始化：若无文件夹则创建示例
function ensureSeed(){
  let d = loadData();
  if(!d["文档区"] && Object.keys(d).length === 0){
    d["文档区"] = { text: "这是示例文字，可以编辑。", images: [] };
    d["图片区"] = { text: "图片区示例", images: [] };
    saveData(d);
  }
}

// ====== UI 渲染 ======
function renderFolderList(filterKeyword = ""){
  const d = loadData();
  folderListEl.innerHTML = "";
  const folders = Object.keys(d);
  if(folders.length === 0){
    const li = document.createElement("li");
    li.textContent = "（空）请新建文件夹";
    folderListEl.appendChild(li);
    return;
  }
  folders.forEach(name => {
    if(filterKeyword){
      const lower = filterKeyword.toLowerCase();
      const text = (d[name].text || "").toLowerCase();
      if(!name.toLowerCase().includes(lower) && !text.includes(lower)) {
        return; // 过滤掉
      }
    }
    const li = document.createElement("li");
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = "📁";
    const meta = document.createElement("div");
    meta.className = "meta";
    const title = document.createElement("div");
    title.textContent = name;
    title.style.fontWeight = "600";
    const snippet = document.createElement("div");
    snippet.textContent = (d[name].text || "").slice(0,80);
    snippet.style.fontSize = "12px";
    snippet.style.color = "#666";
    meta.appendChild(title);
    meta.appendChild(snippet);

    li.appendChild(icon);
    li.appendChild(meta);

    li.addEventListener("click", () => {
      openFolder(name);
    });

    folderListEl.appendChild(li);
  });
}

function openFolder(name){
  activeFolder = name;
  folderTitleEl.textContent = name;
  const d = loadData();
  const folderData = d[name] || { text: "", images: [] };
  textDisplay.textContent = folderData.text || "";
  // images
  imageDisplay.innerHTML = "";
  (folderData.images || []).forEach((b64, idx) => {
    const img = document.createElement("img");
    img.src = b64;
    img.alt = name + "-" + idx;
    img.title = "右键另存或点击查看";
    img.style.cursor = "pointer";
    // 点击放大
    img.addEventListener("click", () => {
      const w = window.open("");
      w.document.write(`<img src="${b64}" style="max-width:100%">`);
    });
    imageDisplay.appendChild(img);
  });

  // 显示区域
  emptyTip.classList.add("hidden");
  folderView.classList.remove("hidden");

  // 编辑器显示与否
  if(canEdit){
    editorSection.classList.remove("hidden");
    textInput.value = folderData.text || "";
  } else {
    editorSection.classList.add("hidden");
  }
}

// ====== 事件处理 ======
pwBtn.addEventListener("click", () => {
  const pw = pwInput.value.trim();
  if(!pw){
    pwMsg.textContent = "请输入密码";
    return;
  }
  if(pw === PASSWORD_EDIT){
    canEdit = true;
    pwMsg.textContent = "";
    pwPanel.style.display = "none";
    mainUi.classList.remove("hidden");
    ensureSeed();
    renderFolderList();
    return;
  }
  if(pw === PASSWORD_VIEW){
    canEdit = false;
    pwMsg.textContent = "";
    pwPanel.style.display = "none";
    mainUi.classList.remove("hidden");
    ensureSeed();
    renderFolderList();
    return;
  }
  pwMsg.textContent = "密码错误";
});

// 新建文件夹
addFolderBtn.addEventListener("click", () => {
  const name = prompt("新文件夹名称：");
  if(!name) return;
  const d = loadData();
  if(d[name]){
    alert("已存在同名文件夹");
    return;
  }
  d[name] = { text: "", images: [] };
  saveData(d);
  renderFolderList();
  openFolder(name);
});

// 搜索（只搜索标题与文字）
searchBtn.addEventListener("click", () => {
  const kw = searchInput.value.trim();
  renderFolderList(kw);
});
resetSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderFolderList();
});

// 保存文字（编辑）
saveBtn.addEventListener("click", () => {
  if(!canEdit){
    alert("当前无编辑权限（需要二级密码）");
    return;
  }
  if(!activeFolder){
    alert("请先选中一个文件夹");
    return;
  }
  const d = loadData();
  d[activeFolder].text = textInput.value;
  saveData(d);
  renderFolderList();
  openFolder(activeFolder);
  alert("已保存");
});

// 上传图片
addImgBtn.addEventListener("click", () => {
  if(!canEdit){ alert("需要二级密码才能上传图片"); return; }
  const files = imgInput.files;
  if(!files || files.length === 0){ alert("请选择图片文件"); return; }
  const d = loadData();
  if(!d[activeFolder]) d[activeFolder] = { text: "", images: [] };

  let remaining = files.length;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e){
      d[activeFolder].images.push(e.target.result);
      remaining--;
      if(remaining === 0){
        saveData(d);
        renderFolderList();
        openFolder(activeFolder);
        imgInput.value = "";
        alert("图片已上传并保存");
      }
    };
    reader.readAsDataURL(file);
  });
});

// 取消编辑（回到显示）
cancelEditBtn.addEventListener("click", () => {
  if(activeFolder) openFolder(activeFolder);
});

// 导出 JSON
exportBtn.addEventListener("click", () => {
  const d = loadData();
  const blob = new Blob([JSON.stringify(d, null, 2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-secure-archive.json";
  a.click();
  URL.revokeObjectURL(url);
});

// 导入 JSON
importBtn.addEventListener("click", () => {
  importFile.click();
});
importFile.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    try {
      const obj = JSON.parse(evt.target.result);
      if(confirm("导入将覆盖当前 localStorage 中的数据，是否继续？")){
        saveData(obj);
        renderFolderList();
        alert("导入完成");
      }
    } catch(err){
      alert("导入失败：文件不是合法的 JSON");
    }
  };
  reader.readAsText(f);
});

// 删除文件夹
deleteFolderBtn.addEventListener("click", () => {
  if(!activeFolder) return;
  if(!confirm(`确认删除文件夹「${activeFolder}」及其所有内容？`)) return;
  const d = loadData();
  delete d[activeFolder];
  saveData(d);
  activeFolder = null;
  folderView.classList.add("hidden");
  emptyTip.classList.remove("hidden");
  renderFolderList();
});

// 重命名
renameFolderBtn.addEventListener("click", () => {
  if(!activeFolder) return;
  const newName = prompt("新的名称：", activeFolder);
  if(!newName || newName === activeFolder) return;
  const d = loadData();
  if(d[newName]){ alert("已存在同名文件夹"); return; }
  d[newName] = d[activeFolder];
  delete d[activeFolder];
  saveData(d);
  activeFolder = newName;
  renderFolderList();
  openFolder(newName);
});

// 清空 localStorage（慎用）
clearBtn.addEventListener("click", () => {
  if(confirm("将清空所有本地数据，是否继续？")) {
    localStorage.removeItem(dataKey);
    ensureSeed();
    renderFolderList();
    folderView.classList.add("hidden");
    emptyTip.classList.remove("hidden");
    alert("已清空本地数据（恢复示例）");
  }
});

// 页面加载
(function init(){
  ensureSeed();
  // 初始不显示 main，等密码正确后显示
})();
