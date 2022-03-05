const __ = document.querySelector.bind(document);
const _a = document.querySelectorAll.bind(document);
const loadCommitsElem = __("#loadCommits");
const clearCacheElem = __("#clearCache");
const CACHE_KEY = "bla";

const initialCredential = () => {
  return {
    authorName: __("#authorName").value.trim(),
    projectId: __("#projectId").value.trim(),
    secretKey: __("#somethingSpecial").value.trim(),
  };
};

const seCredential = (authorName, projectId, secretKey) => {
  authorNameElem.value = authorName;
  projectIdElem.value = projectId;
  secretKeyElem.value = secretKey;
}

const validateinitialCredential = () => {
  const { authorName, projectId, secretKey } = initialCredential();
  if (!authorName || !projectId || !secretKey) {
    throw new Error("Please enter all credential");
  }
};

const getCached = () => {
  const cachedCredential = localStorage.getItem(CACHE_KEY);
  let { authorName, projectId, secretKey } = JSON.parse(cachedCredential);
  secretKey = getAccessText(secretKey);
  return { authorName, projectId, secretKey };
};

const Cached = () => {
  const credential = localStorage.getItem(CACHE_KEY);
  if (credential) return true;
};

const setCache = () => {
  let { authorName, projectId, secretKey } = initialCredential();
  secretKey = setAccessText(secretKey);
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ authorName, projectId, secretKey })
  );
};

const setAccessText = (text) => (text += getRandom());

const getAccessText = (text) => text.split("___")[0];

const clearCache = () => localStorage.removeItem(CACHE_KEY);

const renderCommits = (commits) => {
  if (__("ul") != null) {
    __("ul").remove();
  }
  const ul = document.createElement("ul");
  commits.forEach((commit) => {
    const li = document.createElement("li");
    li.setAttribute("id", "commit");
    li.textContent = commit.title;
    ul.appendChild(li);
  });
  document.body.appendChild(ul);
};

loadCommitsElem.addEventListener("click", async () => {
  try {
    if (Cached()) {
      clearAndSetCache();
      const { authorName, projectId, secretKey } = getCached();
      const commits = await getCommits(authorName, projectId, secretKey);
      renderCommits(commits);
    } else {
      validateinitialCredential();
      const { authorName, projectId, secretKey } = initialCredential();
      const commits = await getCommits(authorName, projectId, secretKey);
      if (confirm("Are you sure to cache this credential?")) setCache();
      renderCommits(commits);
    }
  } catch (err) {
    alert(err);
  }
});

const getCommits = async (authorName, projectId, secretKey) => {
  const commits = [];
  if (!authorName || !projectId || !secretKey) {
    throw new Error("Please enter all credential");
  }
  if (projectId.Includes(',')) {
    const ids = projectId.split(',');
    ids.forEach(x => {
      commits.push(loadCommitsOf(authorName, x, secretKey));
    });
  } else {
    commits.push(loadCommitsOf(authorName, projectId, secretKey))
  }
  return commits;
}

const loadCommitsOf = async (authorName, projectId, secretKey) => {
  const res = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/repository/commits?all=true`,
    {
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": secretKey,
      },
    }
  ).then((res) => res.json());
  return res
    .filter(
      (commit) =>
        commit.author_name === authorName &&
        !commit.title.includes("Merge") &&
        getFormattedDate(new Date(commit.created_at)) === getCurrentDate()
    )
    .map((c) => ({ title: c.title }));
};


const clearAndSetCache = () => {
  const { authorName, projectId, secretKey } = initialCredential();
  const {
    authorName: oldAuthorName,
    projectId: oldProjectId,
    secretKey: oldsecretKey,
  } = getCached();
  if (oldAuthorName !== authorName || oldProjectId !== projectId || oldsecretKey !== secretKey) {
    clearCache();
    setCache();
  }
};

const getFormattedDate = (date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
};

const getCurrentDate = () => getFormattedDate(new Date());

function getRandom(length = 10) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return "___" + result;
}

clearCacheElem.addEventListener("click", () => {
  if (confirm("Are you sure to clear cache?")) {
    clearCache();
    __("ul").innerHTML = "";
    initialCredential();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initialCredential();
  if (Cached()) {
    const { authorName, projectId, secretKey } = getCached();
    seCredential(authorName, projectId, secretKey);
  }
});

document.body.addEventListener('click', (e) => {
  const data = [];
  let x = 1;
  const target = e.target;
  if (target.id != "commit") return;
  _a("li").forEach(li => {
    if (x == 1) {
      data.push(li.textContent);
    } else {
      data.push('+ ' + li.textContent);
    }
    x++;
  })
  navigator.clipboard.writeText(data.join('\n'));
  alert("Copied to clipboard!");
});

