const Popup = document.getElementById("popup");
const taskGroupsContainer = document.getElementById("task-groups-container");
const taskGroupForm = document.getElementById("task-group-form");
const taskGroupInput = document.getElementById("task-group-input");
const taskGroupDesc = document.getElementById("task-group-desc");

let taskGroups = {}; // { グループ名: { desc, tasks: [ { text, done, dueDate } ] } }

// モーダル表示
function openPopup() {
  Popup.style.display = "flex";
  document.body.classList.add("modal-open");
}

function closePopup() {
  Popup.style.display = "none";
  document.body.classList.remove("modal-open");
}

// 保存（ローカルストレージ）
function saveTasks() {
  localStorage.setItem("taskGroups", JSON.stringify(taskGroups));
}

// 読み込み
function loadTasks() {
  const saved = localStorage.getItem("taskGroups");
  if (saved) {
    taskGroups = JSON.parse(saved);
    for (const groupName in taskGroups) {
      renderGroup(groupName);
      updateProgress(groupName);
    }
  }
}

// 進捗更新
window.updateProgress = function(groupName) {
  const tasks = taskGroups[groupName].tasks;
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const progressEl = document.getElementById(`progress-${groupName}`);
  if (progressEl) {
    progressEl.textContent = `進捗: ${done} / ${total}（${percent}%）`;
  }
};

// グループを表示
function renderGroup(name) {
  console.log("renderGroup called for:", name);
  // すでに表示されている場合はスキップ
  if (document.getElementById(`group-${name}`)) return;

  const group = taskGroups[name];
  const desc = group.desc || "";
  const tasks = group.tasks || [];

  const container = document.createElement("div");
  container.classList.add("task-group");
  container.id = `group-${name}`;

  container.innerHTML = `
    <h3>${name}</h3>
    <p>${desc}</p>
    <div class="kebab" tabindex="0">
      <span class="kebab-ball"></span>
      <span class="kebab-ball"></span>
      <span class="kebab-ball"></span>
      <div class="kebab-menu" style="display:none;">
        <button class="edit-group-btn">編集</button>
        <button class="delete-group-btn">削除</button>
      </div>
    </div>
    <form class="task-form">
      <label class="task-label">新しいタスクを追加</label>
      <div class="task-input-row">
        <input type="text" placeholder="タスク内容を入力..." required class="task-input">
        <input type="date" class="task-date">
        <button type="submit">追加</button>
      </div>
    </form>
    <p class="task-progress" id="progress-${name}">進捗: 0 / 0（0%）</p>
    <ul class="task-list"></ul>
  `;

  const form = container.querySelector(".task-form");
  const input = form.querySelector(".task-input");
  const dateInput = form.querySelector(".task-date");
  const ul = container.querySelector(".task-list");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const text = input.value.trim();
    const dueDate = dateInput.value || null;
    if (text === "") return;

    const task = { text, done: false, dueDate };
    taskGroups[name].tasks.push(task);
    renderTask(task, ul, name);
    saveTasks();
    updateProgress(name);
    input.value = "";
    dateInput.value = "";
  });

  // ケバブメニューの表示・非表示
  const kebab = container.querySelector(".kebab");
  const menu = container.querySelector(".kebab-menu");

  kebab.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", function hideMenu(e) {
    if (!container.contains(e.target)) {
      menu.style.display = "none";
    }
  });

  // 編集ボタン
  menu.querySelector(".edit-group-btn").addEventListener("click", () => {
    const newName = prompt("新しいグループ名を入力", name);
    const newDesc = prompt("新しい説明を入力", desc);

    if (!newName || (newName !== name && taskGroups[newName])) {
      alert("グループ名が無効、または既に存在します。");
      menu.style.display = "none";
      return;
    }

    // データ更新
    if (newName !== name) {
      // 新グループ作成
      taskGroups[newName] = {
        desc: newDesc,
        tasks: [...taskGroups[name].tasks]
      };
      // 古いグループ削除
      delete taskGroups[name];
      // 古いDOM削除
      const oldDom = document.getElementById(`group-${name}`);
      if (oldDom) oldDom.remove();
      // 古い進捗表示も削除
      const oldProgress = document.getElementById(`progress-${name}`);
      if (oldProgress) oldProgress.remove();
      // 新しいグループ描画
      renderGroup(newName);
    } else {
      // 名前が同じ場合は説明だけ更新
      taskGroups[newName].desc = newDesc;
      // DOMの説明も更新
      const descP = container.querySelector("p");
      if (descP) descP.textContent = newDesc;
    }
    saveTasks();
    menu.style.display = "none";
  });

  // 削除ボタン
  menu.querySelector(".delete-group-btn").addEventListener("click", () => {
    if (confirm(`「${name}」グループを削除しますか？`)) {
      delete taskGroups[name];
      saveTasks();
      container.remove();
    }
    menu.style.display = "none";
  });

  // タスク描画
  tasks.forEach(task => renderTask(task, ul, name));

  taskGroupsContainer.appendChild(container);
  updateProgress(name);
}

// タスクを表示
function renderTask(task, ul, groupName) {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.addEventListener("change", () => {
    task.done = checkbox.checked;
    li.classList.toggle("completed", task.done);
    saveTasks();
    updateProgress();
  });

  const span = document.createElement("span");
  span.textContent = task.text;

  // 期日があるなら表示する
  const dateSpan = document.createElement("span");
  if (task.dueDate) {
    const formatted = new Date(task.dueDate).toLocaleDateString('ja-JP', {
      month: 'short', day: 'numeric'
    });
    dateSpan.textContent = `（期日: ${formatted}）`;
    dateSpan.style.marginLeft = "0.5em";
    dateSpan.style.fontSize = "0.85em";
    dateSpan.style.color = "#666";
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "削除";
  deleteBtn.classList.add("delete-btn");
  deleteBtn.addEventListener("click", () => {
    taskGroups[groupName].tasks = taskGroups[groupName].tasks.filter(t => t !== task);
    li.remove();
    saveTasks();
    updateProgress(groupName);
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  if (task.dueDate) li.appendChild(dateSpan);
  li.appendChild(deleteBtn);
  li.classList.toggle("completed", task.done);
  ul.appendChild(li);
}

// グループ追加フォーム処理
taskGroupForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = taskGroupInput.value.trim();
  const desc = taskGroupDesc.value.trim();
  if (name === "" || taskGroups[name]) return;

  taskGroups[name] = {
    desc: desc,
    tasks: []
  };

  renderGroup(name);
  saveTasks();
  closePopup();
  this.reset();
});

// 初期化
loadTasks();
