document.addEventListener('DOMContentLoaded', () => {
    const CREDENTIAL_CACHE_KEY = "LOADER_CACHE"
    const COMMIT_CACHE_KEY = "LOADED_HISTORY_CACHE"
    const app = Vue.createApp({
        setup() {
            const credential = Vue.ref({
                projectId: null,
                authorName: null,
                secretKey: null,
            });
            const authorNameElem = Vue.ref(null);
            const commits = Vue.ref({});

            const cached = (key) => {
                const item = localStorage.getItem(key);
                if (item) return true;
            }

            const getCached = (key) => JSON.parse(localStorage.getItem(key));

            const cache = (key, value, isAppend = true) => {
                if (isAppend) {
                    if (typeof value === undefined || value.length < 0) return;
                    if (cached(key)) {
                        const items = getCached(key);
                        value.map(y => {
                            items.push(y);
                        })
                        value = items;
                    }
                }
                localStorage.setItem(key, JSON.stringify(value));
            }

            const clearCache = () => {
                if (confirm("Are you sure you want to clear commit history")) {
                    localStorage.removeItem(COMMIT_CACHE_KEY);
                    commits.value = null;
                }
                if (confirm("Are you sure you want to clear credential")) {
                    localStorage.removeItem(CREDENTIAL_CACHE_KEY);
                    credential.value = {
                        projectId: null,
                        authorName: null,
                        secretKey: null,
                    }
                }

            }

            const getFormattedDate = (date) => {
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const day = date.getDate().toString().padStart(2, "0");
                return date.getFullYear() + "-" + month + "-" + day;
            };

            const getCurrentDate = () => getFormattedDate(new Date());

            const copyToClipboard = () => {
                const data = [];
                if (commits.value.length > 0) {
                    commits.value.forEach(c => {
                        if (commits.value.indexOf(c) === 0) {
                            data.push(c.title);
                        } else {
                            data.push('+ ' + c.title);
                        }
                    })
                }
                navigator.clipboard.writeText(data.join('\n'));
            }

            const cacheCredential = () => {
                const item = credential.value;
                if (!item.authorName || !item.projectId || !item.secretKey) {
                    alert("Invalid credential provided")
                }
                cache(CREDENTIAL_CACHE_KEY, {
                    authorName: item.authorName,
                    projectId: item.projectId,
                    secretKey: item.secretKey
                }, false);
            }

            const getCommits = async () => {
                const items = [];
                const projects = credential.value.projectId.split(",");
                for (const x of projects) {
                    const url = `https://gitlab.com/api/v4/projects/${x}/repository/commits?all=true`
                    const res = await fetch(url, {
                        headers: {
                            "Content-Type": "application/json",
                            "PRIVATE-TOKEN": credential.value.secretKey,
                        },
                    }).then(res => res.json())
                    const y = res.filter((commit) => commit.author_name === credential.value.authorName
                        && !commit.title.includes("Merge")
                        && getFormattedDate(new Date(commit.created_at)) === getCurrentDate()).map((c) => ({ title: c.title, created_at: c.created_at }));
                    y.forEach(x => {
                        items.push(x);
                    });
                }
                return items;
            }

            const storeCommit = async () => {
                let addedCommits = await getCommits();
                if (cached(CREDENTIAL_CACHE_KEY)) {
                    if (cached(COMMIT_CACHE_KEY)) {
                        const histories = getCached(COMMIT_CACHE_KEY);
                        for (const x of histories) {
                            for (const y of addedCommits) {
                                if (x.title === y.title) {
                                    addedCommits = addedCommits.filter(c => c.title !== y.title);
                                }
                            }
                        }
                        cache(COMMIT_CACHE_KEY, addedCommits);
                    } else {
                        cache(COMMIT_CACHE_KEY, addedCommits);
                    }
                } else {
                    authorNameElem.value.focus();
                }
            }

            const updateHistory = async () => {
                await storeCommit();
                commits.value = getDayWiseCommitList(getCached(COMMIT_CACHE_KEY));
            }

            const getDayWiseCommitList = (commits) => {
                const dayWiseCommitList = [];
                commits.forEach(commit => {
                    const date = new Date(commit.created_at);
                    const day = date.getDate();
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    const key = `${year}-${month}-${day}`;
                    const item = dayWiseCommitList.find(x => x.date === key);
                    if (item) {
                        item.commits.push(commit);
                    }
                    else {
                        dayWiseCommitList.push({
                            date: key,
                            commits: [commit]
                        });
                    }
                });
                return dayWiseCommitList.sort((a, b) => a.date < b.date ? 1 : -1);
            }

            Vue.onMounted(() => {
                authorNameElem.value.focus();
                if (cached(CREDENTIAL_CACHE_KEY)) {
                    credential.value = getCached(CREDENTIAL_CACHE_KEY);
                    setInterval(async () => {
                        await updateHistory();
                    }, 600000);
                }
            })

            return {
                credential,
                commits,
                authorNameElem,
                updateHistory,
                cacheCredential,
                clearCache,
                copyToClipboard
            }
        }
    }).mount("#app");
})
