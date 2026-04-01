const fs = require('fs');
const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzUxZDBmMDg5Njc3ZjQ5ZWNhYjcyNWNkMzY1MTJhYzViEgsSBxDDl-v-vQgYAZIBIwoKcHJvamVjdF9pZBIVQhM0NjE5NTk4MTA2NjE4NjYwOTkx&filename=&opi=89354086";

fetch(url)
  .then(res => res.text())
  .then(html => {
    fs.writeFileSync("vault_home.html", html);
    console.log("Successfully downloaded HTML!");
  })
  .catch(err => console.error("Error downloading:", err));
