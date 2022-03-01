const __ = document.querySelector.bind(document);
const _a = document.querySelectorAll.bind(document);
const authorNameElem = __("#authorName");
const projectIdElem = __("#projectId");
const somethingSpecialElem = __("#somethingSpecial");
const loadCommitsElem = __("#loadCommits");
clearCacheElem = __("#clearCache");

const credentilInfos = () => {
  return {
    authorName: authorNameElem.value.trim(),
    projectId: projectIdElem.value.trim(),
    somethingSpecial: somethingSpecialElem.value.trim(),
  };
};

const validateCredentilInfos = () => {
  const { authorName, projectId, somethingSpecial } = credentilInfos();
  if (!authorName || !projectId || !somethingSpecial)
    throw new Error("Please enter all credentil");
};

document.addEventListener("DOMContentLoaded", () => {
  credentilInfos();
});

const getCacheed = () => {
  const cachedCredentil = localStorage.getItem("bla");
  let { authorName, projectId, somethingSpecial } = JSON.parse(cachedCredentil);
  somethingSpecial = getAccessText(somethingSpecial);
  return { authorName, projectId, somethingSpecial };
};

const hasCacheed = () => {
  const cachedCredentil = localStorage.getItem("bla");
  if (cachedCredentil) return true;
};

const setCache = () => {
  let { authorName, projectId, somethingSpecial } = credentilInfos();
  somethingSpecial = setAccessText(somethingSpecial);
  localStorage.setItem(
    "bla",
    JSON.stringify({ authorName, projectId, somethingSpecial })
  );
};

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
    if (hasCacheed()) {
      clearAndSetCache();
      const { authorName, projectId, somethingSpecial } = getCacheed();
      const commits = await getCommits(authorName, projectId, somethingSpecial);
      renderCommits(commits);
    } else {
      validateCredentilInfos();
      const { authorName, projectId, somethingSpecial } = credentilInfos();
      const commits = await getCommits(authorName, projectId, somethingSpecial);
      if (confirm("Are you sure to cahce this credentil?")) setCache();
      renderCommits(commits);
    }
  } catch (err) {
    alert(err);
  }
});

const getCommits = async (authorName, projectId, somethingSpecial) => {
  if (!authorName || !projectId || !somethingSpecial)
    throw new Error("Please enter all credentil");
  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/repository/commits?all=true`,
    {
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": somethingSpecial,
      },
    }
  ).then((res) => res.json());
  console.log(res);
  return res
    .filter(
      (commit) =>
        commit.author_name === authorName &&
        !commit.title.includes("Merge") &&
        getFormatedDate(new Date(commit.created_at)) == getCurrentDate()
    )
    .map((c) => ({ title: c.title }));
};

document.addEventListener("DOMContentLoaded", () => {
  if (hasCacheed()) {
    const { authorName, projectId, somethingSpecial } = getCacheed();
    authorNameElem.value = authorName;
    projectIdElem.value = projectId;
    somethingSpecialElem.value = somethingSpecial;
  }
});

const clearAndSetCache = () => {
  const { authorName, projectId, somethingSpecial } = credentilInfos();
  const {
    authorName: oldAuthorName,
    projectId: oldProjectId,
    somethingSpecial: oldsomethingSpecial,
  } = getCacheed();
  if (
    oldAuthorName != authorName ||
    oldProjectId != projectId ||
    oldsomethingSpecial != somethingSpecial
  ) {
    clearCache();
    setCache();
  }
};

clearCacheElem.addEventListener("click", () => {
  if (confirm("Are you sure to clear cache?")) {
    clearCache();
    renderCommits();
    authorNameElem.value = "";
    projectIdElem.value = "";
    somethingSpecialElem.value = "";
  }
});

const getFormatedDate = (date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
};
const getCurrentDate = () => getFormatedDate(new Date());

const setAccessText = (text) => (text += getRandom());

const getAccessText = (text) => {
  return text.split("___")[0];
};

function getRandom(length = 10) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return "___" + result;
}
