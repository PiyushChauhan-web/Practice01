"use strict";

/* =====================================================
   Practice01 — interactive learning page
   Sections: 1) Git flow  2) Dockerfile explainer
             3) GitHub Actions simulator  4) Glossary
   ===================================================== */

console.log("Practice01 loaded. Open the page and try the Git buttons!");

/* ---------- tiny helpers ---------- */
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* =====================================================
   1) GIT FLOW SIMULATOR
   ===================================================== */
const FILE_POOL = ["index.html", "app.js", "README.md", "Dockerfile", "style.css"];

const git = {
    working: [],   // modified files not yet staged
    staging: [],   // files added with `git add`
    local: [],     // commits on your machine
    remote: [],    // commits on GitHub
    nextFile: 0,
    nextCommit: 1,
};

const terminal = $("terminal");

function log(text, type = "out") {
    const line = document.createElement("div");
    line.className = type;
    line.textContent = type === "cmd" ? "$ " + text : text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function renderList(containerId, items, cssClass) {
    const box = $(containerId);
    box.innerHTML = "";
    if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "(empty)";
        box.appendChild(empty);
        return;
    }
    items.forEach((text) => {
        const chip = document.createElement("span");
        chip.className = "chip " + cssClass;
        chip.textContent = text;
        box.appendChild(chip);
    });
}

function flash(zoneId) {
    const zone = $(zoneId);
    zone.classList.add("active");
    setTimeout(() => zone.classList.remove("active"), 700);
}

function renderGit() {
    renderList("list-working", git.working.map((f) => "M " + f), "file-mod");
    renderList("list-staging", git.staging.map((f) => "+ " + f), "file-staged");
    renderList("list-local", git.local, "commit");
    renderList("list-remote", git.remote, "remote");

    $("btn-add").disabled = git.working.length === 0;
    $("btn-commit").disabled = git.staging.length === 0;
    $("btn-push").disabled = git.local.length === git.remote.length;
}

function editFile() {
    const file = FILE_POOL[git.nextFile % FILE_POOL.length];
    git.nextFile++;
    if (!git.working.includes(file) && !git.staging.includes(file)) {
        git.working.push(file);
    }
    log("(you edit " + file + " in your editor)", "out");
    log("Why: Git notices the file differs from the last commit. It is 'modified' but not saved into history yet.", "why");
    flash("zone-working");
    renderGit();
}

function gitAdd() {
    log("git add .", "cmd");
    git.staging.push(...git.working);
    log("Moved " + git.working.length + " file(s) to staging.");
    log("Why: staging lets you choose exactly which changes go into the next commit.", "why");
    git.working = [];
    flash("zone-staging");
    renderGit();
}

function gitCommit() {
    const label = "commit #" + git.nextCommit++ + " (" + git.staging.join(", ") + ")";
    log('git commit -m "update ' + git.staging.join(", ") + '"', "cmd");
    git.local.push(label);
    log("Created " + label);
    log("Why: a commit is a permanent snapshot in your LOCAL history. GitHub still knows nothing about it.", "why");
    git.staging = [];
    flash("zone-local");
    renderGit();
}

function gitPush() {
    log("git push origin main", "cmd");
    const unpushed = git.local.slice(git.remote.length);
    if (unpushed.length === 0) {
        log("Everything up-to-date", "err");
        return;
    }
    git.remote.push(...unpushed);
    log("Uploaded " + unpushed.length + " commit(s) to GitHub.");
    log("Why: push copies your local commits to the remote repo. This is also what TRIGGERS GitHub Actions (see section 3).", "why");
    flash("zone-remote");
    renderGit();
}

function resetGit() {
    git.working = [];
    git.staging = [];
    git.local = [];
    git.remote = [];
    git.nextFile = 0;
    git.nextCommit = 1;
    terminal.innerHTML = "";
    log("Simulator reset. Start with 'Edit a file'.", "out");
    renderGit();
}

$("btn-edit").addEventListener("click", editFile);
$("btn-add").addEventListener("click", gitAdd);
$("btn-commit").addEventListener("click", gitCommit);
$("btn-push").addEventListener("click", gitPush);
$("btn-reset").addEventListener("click", resetGit);
resetGit();

/* =====================================================
   2) DOCKERFILE EXPLAINER
   (keep these lines identical to the real Dockerfile)
   ===================================================== */
const DOCKERFILE = [
    {
        code: "FROM nginx:1.27-alpine",
        title: "FROM — pick a base image",
        text: "Every image starts from another image. nginx is a web server, and 'alpine' is a tiny Linux, so the final image stays small.",
    },
    {
        code: "COPY index.html app.js /usr/share/nginx/html/",
        title: "COPY — put your files inside",
        text: "Copies your website files from your repo into the folder where nginx looks for pages to serve.",
    },
    {
        code: "EXPOSE 80",
        title: "EXPOSE — document the port",
        text: "Says the app listens on port 80 inside the container. It is documentation; the real mapping happens with 'docker run -p 8080:80'.",
    },
    {
        code: "HEALTHCHECK CMD wget -qO- http://localhost/ > /dev/null || exit 1",
        title: "HEALTHCHECK — is it alive?",
        text: "Docker runs this command regularly. If the page cannot be fetched, the container is marked 'unhealthy'.",
    },
];

function buildDockerView() {
    const view = $("dockerfile-view");
    DOCKERFILE.forEach((item, index) => {
        const btn = document.createElement("button");
        btn.className = "code-line";
        btn.textContent = item.code;
        btn.addEventListener("click", () => selectDockerLine(index));
        view.appendChild(btn);
    });
}

function selectDockerLine(index) {
    document.querySelectorAll(".code-line").forEach((el, i) => {
        el.classList.toggle("selected", i === index);
    });
    const item = DOCKERFILE[index];
    const box = $("docker-explain");
    box.innerHTML = "";
    const h = document.createElement("h4");
    h.textContent = item.title;
    const p = document.createElement("p");
    p.textContent = item.text;
    box.append(h, p);
}

buildDockerView();
selectDockerLine(0);

/* =====================================================
   3) GITHUB ACTIONS SIMULATOR
   ===================================================== */
const ACTION_STEPS = [
    { title: "Trigger: push to main", text: "GitHub sees your push and looks in .github/workflows/ for matching workflow files." },
    { title: "Start a runner", text: "GitHub boots a fresh virtual machine (ubuntu-latest). It has nothing of yours yet." },
    { title: "actions/checkout", text: "Downloads your repo code onto that machine so later steps can use it." },
    { title: "docker build", text: "Runs 'docker build -t practice01 .' using your Dockerfile to create the image." },
    { title: "docker run + test", text: "Starts the container and checks the page responds (curl). If this fails, the run turns red." },
    { title: "Result: ✅ or ❌", text: "You see a green check or red cross on your commit. The VM is then thrown away." },
];

let running = false;

function renderActionSteps() {
    const list = $("action-steps");
    list.innerHTML = "";
    ACTION_STEPS.forEach((step, i) => {
        const li = document.createElement("li");
        li.className = "step";
        li.id = "step-" + i;
        const dot = document.createElement("div");
        dot.className = "dot";
        dot.textContent = String(i + 1);
        const body = document.createElement("div");
        const b = document.createElement("b");
        b.textContent = step.title;
        const p = document.createElement("p");
        p.textContent = step.text;
        body.append(b, p);
        li.append(dot, body);
        list.appendChild(li);
    });
}

async function runWorkflow() {
    if (running) return;
    running = true;
    $("btn-run").disabled = true;
    renderActionSteps();
    for (let i = 0; i < ACTION_STEPS.length; i++) {
        const el = $("step-" + i);
        el.classList.add("running");
        await sleep(900);
        el.classList.remove("running");
        el.classList.add("done");
        el.querySelector(".dot").textContent = "✓";
    }
    running = false;
    $("btn-run").disabled = false;
}

$("btn-run").addEventListener("click", runWorkflow);
$("btn-run-reset").addEventListener("click", () => {
    if (!running) renderActionSteps();
});
renderActionSteps();

/* =====================================================
   4) GLOSSARY
   ===================================================== */
const GLOSSARY = [
    ["Repository (repo)", "A project folder whose history Git tracks."],
    ["Commit", "A saved snapshot of your files with a message."],
    ["Branch", "A separate line of work. 'main' is the default one."],
    ["Remote / origin", "The copy of your repo on GitHub. 'origin' is its nickname."],
    ["Push / Pull", "Push uploads your commits. Pull downloads other people's."],
    ["Image", "A read-only package containing your app and what it needs."],
    ["Container", "A running instance of an image."],
    ["Workflow", "A YAML file in .github/workflows describing automation."],
    ["Runner", "The temporary machine that executes a workflow."],
];

const gloss = $("gloss");
GLOSSARY.forEach(([term, meaning]) => {
    const card = document.createElement("div");
    card.className = "card";
    const h = document.createElement("h4");
    h.textContent = term;
    const p = document.createElement("p");
    p.textContent = meaning;
    card.append(h, p);
    gloss.appendChild(card);
});
