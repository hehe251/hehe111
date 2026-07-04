// ===== 云端存储配置 =====
const SUPABASE_URL = "https://cqyvdzlnbimnrqwzvmll.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_adW2Rwkl4ffDHrqrhJBM9w_-4VcAlg-";

let useCloud = true;

// ===== LocalStorage 操作 =====
const STORAGE_KEY = "diary_entries_cloud";

function getEntriesLocal() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveEntriesLocal(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntryLocal(entry) {
    const entries = getEntriesLocal();
    entry.id = entry.id || Date.now().toString();
    entry.createdAt = entry.createdAt || new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    entries.unshift(entry);
    saveEntriesLocal(entries);
    return entry;
}

function updateEntryLocal(id, updates) {
    const entries = getEntriesLocal();
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
        entries[index] = { ...entries[index], ...updates, updatedAt: new Date().toISOString() };
        saveEntriesLocal(entries);
        return entries[index];
    }
    return null;
}

function deleteEntryLocal(id) {
    let entries = getEntriesLocal();
    entries = entries.filter(e => e.id !== id);
    saveEntriesLocal(entries);
}

function getEntryLocal(id) {
    return getEntriesLocal().find(e => e.id === id);
}

// ===== 云端存储操作（直接用 fetch）=====
const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

async function getEntriesCloud() {
    try {
        const res = await fetch(SUPABASE_URL + "/rest/v1/diaries?order=created_at.desc&limit=100", { headers });
        if (!res.ok) throw new Error("获取失败: " + res.status);
        return await res.json();
    } catch (e) {
        console.error("获取日记失败:", e);
        return [];
    }
}

async function addEntryCloud(entry) {
    try {
        const res = await fetch(SUPABASE_URL + "/rest/v1/diaries", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
                title: entry.title,
                content: entry.content,
                mood: entry.mood,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });
        if (!res.ok) throw new Error("添加失败: " + res.status);
        return await res.json();
    } catch (e) {
        console.error("添加日记失败:", e);
        return null;
    }
}

async function updateEntryCloud(id, updates) {
    try {
        const res = await fetch(SUPABASE_URL + "/rest/v1/diaries?id=eq." + id, {
            method: "PATCH",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
                title: updates.title,
                content: updates.content,
                mood: updates.mood,
                updated_at: new Date().toISOString()
            })
        });
        if (!res.ok) throw new Error("更新失败: " + res.status);
        return await res.json();
    } catch (e) {
        console.error("更新日记失败:", e);
        return null;
    }
}

async function deleteEntryCloud(id) {
    try {
        const res = await fetch(SUPABASE_URL + "/rest/v1/diaries?id=eq." + id, {
            method: "DELETE",
            headers: headers
        });
        if (!res.ok) throw new Error("删除失败: " + res.status);
        return true;
    } catch (e) {
        console.error("删除日记失败:", e);
        return false;
    }
}

async function getEntryCloud(id) {
    try {
        const res = await fetch(SUPABASE_URL + "/rest/v1/diaries?id=eq." + id, { headers });
        if (!res.ok) throw new Error("获取失败: " + res.status);
        const data = await res.json();
        return data.length > 0 ? data[0] : null;
    } catch (e) {
        console.error("获取日记失败:", e);
        return null;
    }
}

// ===== 统一数据接口 =====
async function getEntries() {
    return await getEntriesCloud();
}

async function addEntry(entry) {
    const result = await addEntryCloud(entry);
    if (result) {
        addEntryLocal({ ...entry, id: result.id, createdAt: result.created_at, updatedAt: result.updated_at });
    }
    return result;
}

async function updateEntry(id, updates) {
    const result = await updateEntryCloud(id, updates);
    if (result && result.length > 0) {
        updateEntryLocal(id, { ...updates, id, createdAt: result[0].created_at, updatedAt: result[0].updated_at });
    }
    return result;
}

async function deleteEntry(id) {
    await deleteEntryCloud(id);
    deleteEntryLocal(id);
}

async function getEntry(id) {
    const result = await getEntryCloud(id);
    if (result) {
        return { ...result, createdAt: result.created_at, updatedAt: result.updated_at };
    }
    return null;
}

// ===== 心情配置 =====
const MOODS = {
    happy: { emoji: "😊", label: "开心" },
    calm: { emoji: "😌", label: "平静" },
    sad: { emoji: "😢", label: "难过" },
    angry: { emoji: "😠", label: "生气" },
    excited: { emoji: "🤩", label: "兴奋" },
    tired: { emoji: "😴", label: "疲惫" }
};

// ===== 工具函数 =====
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    
    return date.toLocaleDateString("zh-CN", { 
        year: "numeric", month: "short", day: "numeric" 
    });
}

function formatFullDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
        year: "numeric", month: "long", day: "numeric",
        weekday: "long"
    });
}

function filterByTime(entries, filter) {
    if (filter === "all") return entries;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return entries.filter(entry => {
        const entryDate = new Date(entry.created_at || entry.createdAt);
        if (filter === "today") {
            return entryDate >= today;
        } else if (filter === "week") {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return entryDate >= weekAgo;
        } else if (filter === "month") {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return entryDate >= monthAgo;
        }
        return true;
    });
}

// ===== UI 引用 =====
const diaryListEl = document.getElementById("diaryList");
const searchInputEl = document.getElementById("searchInput");
const editorPanelEl = document.getElementById("editorPanel");
const previewPanelEl = document.getElementById("previewPanel");
const diaryPreviewEl = document.getElementById("diaryPreview");
const emptyStateEl = document.getElementById("emptyState");
const editorDateEl = document.getElementById("editorDate");
const diaryTitleEl = document.getElementById("diaryTitle");
const diaryContentEl = document.getElementById("diaryContent");
const previewTitleEl = document.getElementById("previewTitle");
const previewDateEl = document.getElementById("previewDate");
const previewMoodEl = document.getElementById("previewMood");
const previewContentEl = document.getElementById("previewContent");

let currentFilter = "all";
let currentEntryId = null;
let editingId = null;
let selectedMood = null;
let isLoading = false;

// ===== 渲染日记列表 =====
async function renderDiaryList() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        const entries = await getEntries();
        const searchTerm = searchInputEl.value.toLowerCase();
        let filtered = entries.filter(e => 
            (e.title || "").toLowerCase().includes(searchTerm) || 
            (e.content || "").toLowerCase().includes(searchTerm)
        );
        filtered = filterByTime(filtered, currentFilter);
        
        if (filtered.length === 0) {
            diaryListEl.innerHTML = `
                <div class="empty-list">
                    <p>${searchTerm ? "没有找到匹配的日记" : "还没有日记，开始写第一篇吧！"}</p>
                </div>
            `;
            return;
        }
        
        diaryListEl.innerHTML = filtered.map(entry => {
            const mood = entry.mood ? MOODS[entry.mood] : null;
            const preview = (entry.content || "").substring(0, 60) + ((entry.content || "").length > 60 ? "..." : "");
            const isActive = entry.id === currentEntryId || entry.id === editingId;
            const dateField = entry.created_at || entry.createdAt;
            
            return `
                <div class="diary-item ${isActive ? "active" : ""}" data-id="${entry.id}">
                    <div class="diary-item-header">
                        <span class="diary-item-title">${entry.title || "无标题"}</span>
                        <span class="diary-item-date">${formatDate(dateField)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="diary-item-preview">${preview || "暂无内容"}</span>
                        ${mood ? `<span class="diary-item-mood">${mood.emoji}</span>` : ""}
                    </div>
                </div>
            `;
        }).join("");
        
        document.querySelectorAll(".diary-item").forEach(item => {
            item.addEventListener("click", () => {
                const id = item.dataset.id;
                showPreview(id);
            });
        });
    } catch (e) {
        console.error("渲染列表失败:", e);
    } finally {
        isLoading = false;
    }
}

// ===== 显示预览 =====
async function showPreview(id) {
    const entry = await getEntry(id);
    if (!entry) return;
    
    currentEntryId = id;
    editingId = null;
    selectedMood = null;
    
    hideEditor();
    previewPanelEl.style.display = "flex";
    emptyStateEl.style.display = "none";
    diaryPreviewEl.style.display = "block";
    
    previewTitleEl.textContent = entry.title || "无标题";
    previewDateEl.textContent = formatFullDate(entry.created_at || entry.createdAt);
    previewContentEl.textContent = entry.content || "";
    
    if (entry.mood && MOODS[entry.mood]) {
        previewMoodEl.textContent = `${MOODS[entry.mood].emoji} ${MOODS[entry.mood].label}`;
    } else {
        previewMoodEl.textContent = "";
    }
    
    renderDiaryList();
}

// ===== 显示编辑器 =====
function showEditor(entry = null) {
    hidePreview();
    editorPanelEl.style.display = "flex";
    
    if (entry) {
        editingId = entry.id;
        diaryTitleEl.value = entry.title || "";
        diaryContentEl.value = entry.content || "";
        selectedMood = entry.mood || null;
        editorDateEl.textContent = `编辑于 ${formatFullDate(entry.updated_at || entry.updatedAt || new Date().toISOString())}`;
    } else {
        editingId = null;
        diaryTitleEl.value = "";
        diaryContentEl.value = "";
        selectedMood = null;
        editorDateEl.textContent = formatFullDate(new Date().toISOString());
    }
    
    document.querySelectorAll(".mood-btn").forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.mood === selectedMood);
    });
    
    setTimeout(() => diaryTitleEl.focus(), 100);
}

function hideEditor() {
    editorPanelEl.style.display = "none";
    editingId = null;
}

function hidePreview() {
    previewPanelEl.style.display = "none";
    currentEntryId = null;
}

// ===== 保存日记 =====
async function saveDiary() {
    const title = diaryTitleEl.value.trim();
    const content = diaryContentEl.value.trim();
    
    if (!title && !content) {
        alert("请输入标题或内容");
        return;
    }
    
    const data = { title, content, mood: selectedMood };
    
    try {
        if (editingId) {
            await updateEntry(editingId, data);
        } else {
            await addEntry(data);
        }
        
        hideEditor();
        await renderDiaryList();
        
        if (editingId) {
            showPreview(editingId);
        } else {
            const entries = await getEntries();
            if (entries.length > 0) {
                showPreview(entries[0].id);
            }
        }
    } catch (e) {
        console.error("保存失败:", e);
        alert("保存失败，请重试");
    }
}

// ===== 删除日记 =====
async function deleteCurrentDiary() {
    if (!currentEntryId) return;
    
    if (confirm("确定要删除这篇日记吗？此操作不可恢复。")) {
        await deleteEntry(currentEntryId);
        hidePreview();
        emptyStateEl.style.display = "flex";
        diaryPreviewEl.style.display = "none";
        await renderDiaryList();
    }
}

// ===== 事件绑定 =====
document.getElementById("newDiaryBtn").addEventListener("click", () => showEditor());
document.getElementById("backBtn").addEventListener("click", () => {
    hideEditor();
    if (currentEntryId) {
        showPreview(currentEntryId);
    } else {
        emptyStateEl.style.display = "flex";
    }
});
document.getElementById("saveBtn").addEventListener("click", saveDiary);
document.getElementById("editBtn").addEventListener("click", async () => {
    const entry = await getEntry(currentEntryId);
    if (entry) showEditor(entry);
});
document.getElementById("deleteBtn").addEventListener("click", deleteCurrentDiary);

document.querySelectorAll(".mood-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedMood = btn.dataset.mood;
    });
});

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderDiaryList();
    });
});

searchInputEl.addEventListener("input", renderDiaryList);

// ===== 初始化 =====
console.log("🚀 应用启动，使用云端存储");
renderDiaryList();


