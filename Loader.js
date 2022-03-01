const __ = document.querySelector.bind(document);
const _a = document.querySelectorAll.bind(document);
const authorNameElem = __("#authorName");
const projectIdElem = __("#projectId");
const somethingSpecialElem = __("#somethingSpecial");
const loadCommitsElem = __("#loadCommits");
const clearCacheElem = __("#clearCache");

const initialCredential = () => {
  return {
    authorName: authorNameElem.value.trim(),
    projectId: projectIdElem.value.trim(),
    somethingSpecial: somethingSpecialElem.value.trim(),
  };
};

const setinitialCredential = (authorName, projectId, somethingSpecial) => {
  authorNameElem.value = authorName;
  projectIdElem.value = projectId;
  somethingSpecialElem.value = somethingSpecial;
}

const validateinitialCredential = () => {
  const { authorName, projectId, somethingSpecial } = initialCredential();
  if (!authorName || !projectId || !somethingSpecial) {
    throw new Error("Please enter all credential");
  }
};

const getCached = () => {
  const cachedCredential = localStorage.getItem("bla");
  let { authorName, projectId, somethingSpecial } = JSON.parse(cachedCredential);
  somethingSpecial = getAccessText(somethingSpecial);
  return { authorName, projectId, somethingSpecial };
};

const hasCached = () => {
  const cachedCredential = localStorage.getItem("bla");
  if (cachedCredential) return true;
};

const setCache = () => {
  let { authorName, projectId, somethingSpecial } = initialCredential();
  somethingSpecial = setAccessText(somethingSpecial);
  localStorage.setItem(
    "bla",
    JSON.stringify({ authorName, projectId, somethingSpecial })
  );
};

const setAccessText = (text) => (text += getRandom());

const getAccessText = (text) => text.split("___")[0];

const clearCache = () => localStorage.removeItem("bla");

const renderCommits = (commits) => {
  if (__("ul") != null) {
    __("ul").remove();
  }
  const ul = document.createElement("ul");
  ul.setAttribute("id", "commits");
  commits.forEach((commit) => {
    const li = document.createElement("li");
    li.textContent = commit.title;
    ul.appendChild(li);
  });
  document.body.appendChild(ul);
};

loadCommitsElem.addEventListener("click", async () => {
  try {
    if (hasCached()) {
      clearAndSetCache();
      const { authorName, projectId, somethingSpecial } = getCached();
      const commits = await getCommits(authorName, projectId, somethingSpecial);
      renderCommits(commits);
    } else {
      validateinitialCredential();
      const { authorName, projectId, somethingSpecial } = initialCredential();
      const commits = await getCommits(authorName, projectId, somethingSpecial);
      if (confirm("Are you sure to cache this credential?")) setCache();
      renderCommits(commits);
    }
  } catch (err) {
    alert(err);
  }
});

const getCommits = async (authorName, projectId, somethingSpecial) => {
  if (!authorName || !projectId || !somethingSpecial)
    throw new Error("Please enter all credential");
  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/repository/commits?all=true`,
    {
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": somethingSpecial,
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
  const { authorName, projectId, somethingSpecial } = initialCredential();
  const {
    authorName: oldAuthorName,
    projectId: oldProjectId,
    somethingSpecial: oldsomethingSpecial,
  } = getCached();
  if (oldAuthorName !== authorName || oldProjectId !== projectId || oldsomethingSpecial !== somethingSpecial) {
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
  if (hasCached()) {
    const { authorName, projectId, somethingSpecial } = getCached();
    setinitialCredential(authorName, projectId, somethingSpecial);
  }
});


__("ul").addEventListener("click", () => {
  const data = [];
  _a("#commits").forEach(li => {
    data.push(li.textContent);
  })
  console.log(data);
})