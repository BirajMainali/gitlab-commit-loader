document.addEventListener('DOMContentLoaded', (key, value) => {
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
                    if (typeof value === undefined) return;
                    if (cached(key)) {
                        const items = getCached(key);
                        value.map(y => {
                            items.push(y);
                        })
                        value = items;
                    }
                }
                localStorage.removeItem(key);
                localStorage.setItem(key, JSON.stringify(value));
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
                    const y = res.filter((commit) => commit.author_name === credential.value.authorName && !commit.title.includes("Merge") && getFormattedDate(new Date(commit.created_at)) === getCurrentDate()).map((c) => ({title: c.title}));
                    y.forEach(x => {
                        items.push(x);
                    })
                }
                return items;
            }

            const storeCommit = async () => {
                const recentCommits = [];
                let addedCommits = await getCommits();
                if (cached(CREDENTIAL_CACHE_KEY)) {
                    if (cached(COMMIT_CACHE_KEY)) {
                        const histories = getCached(COMMIT_CACHE_KEY);
                        for (const x of histories) {
                            addedCommits = addedCommits.filter(c => c.title !== x.title);
                        }
                        cache(COMMIT_CACHE_KEY, recentCommits);
                    } else {
                        cache(COMMIT_CACHE_KEY, addedCommits);
                    }
                } else {
                    authorNameElem.value.focus();
                }
            }

            const updateHistory = async () => {
                setTimeout(() => {
                    storeCommit();
                });
                commits.value = getCached(COMMIT_CACHE_KEY);
            }

            Vue.onMounted(() => {
                authorNameElem.value.focus();
                if (cached(CREDENTIAL_CACHE_KEY)) {
                    credential.value = getCached(CREDENTIAL_CACHE_KEY);
                    setInterval(async () => {
                        await updateHistory();
                    }, 60000);
                }
            })

            return {
                credential,
                commits,
                authorNameElem,
                updateHistory,
                storeCommit,
                getCached,
                cache,
                cached,
                getCommits,
                cacheCredential,
                getCurrentDate,
                getFormattedDate,
                copyToClipboard
            }
        }
    }).mount("#app");
})
;