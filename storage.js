export function getProjectsFromStorage() {
    return JSON.parse(localStorage.getItem('myProjects')) || [];
}

export function saveProject(projectObj) {
    let projects = getProjectsFromStorage();
    projects.push(projectObj);
    localStorage.setItem('myProjects', JSON.stringify(projects));
}

export function updateProject(projectId, updatedData) {
    let projects = getProjectsFromStorage();
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
        projects[index] = { id: projectId, ...updatedData };
        localStorage.setItem('myProjects', JSON.stringify(projects));
    }
}

export function deleteProjectFromStorage(projectId) {
    let projects = getProjectsFromStorage();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('myProjects', JSON.stringify(projects));
}