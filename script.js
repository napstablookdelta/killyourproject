// Находим элементы интерфейса
const projectForm = document.getElementById('project-form');
const linksFormContainer = document.getElementById('links-form-container');
const addLinkFieldBtn = document.getElementById('add-link-field-btn');
const projectsListContainer = document.getElementById('projects-list-container');
const profileView = document.getElementById('profile-view');
const detailsView = document.getElementById('details-view');
const backBtn = document.getElementById('back-btn');

let editModeId = null;

// Находим элементы зоны загрузки файлов
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const hiddenImageInput = document.getElementById('proj-image-base64');
const dropZoneText = document.getElementById('drop-zone-text');

// 1. Клик по зоне открывает системное окно выбора файла
dropZone.addEventListener('click', () => fileInput.click());

// Визуальный интерактив: зона подсвечивается фиолетовым при перетаскивании файла
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#8a2be2';
    dropZone.style.background = '#1a0f24';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#3dac78';
    dropZone.style.background = '#160d1f';
});

// 2. Ловим файл при сбросе (Drag and Drop)
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#3dac78';
    dropZone.style.background = '#160d1f';
    
    if (e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
    }
});

// Ловим файл при обычном выборе через клик
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
});

// 3. Главная магия: превращаем физический файл в строку данных (Data URL)
function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Система принимает только изображения!');
        return;
    }

    // Проверка на размер для локального MVP (чтобы не забить LocalStorage слишком быстро)
    if (file.size > 2 * 1024 * 1024) { // 2 MB
        alert('Файл слишком тяжелый для локального лога. Сожмите его до 2МБ.');
        return;
    }

    const reader = new FileReader();
    
    // Когда файл прочитан браузером
    reader.onload = function(event) {
        const base64String = event.target.result; // Это зашифрованная строка картинки
        
        // Записываем её в скрытый инпут, чтобы форма её подхватила
        hiddenImageInput.value = base64String;
        
        // Показываем превью художнику
        imagePreview.src = base64String;
        imagePreviewContainer.style.display = 'block';
        dropZoneText.innerText = `✓ Файл загружен: ${file.name}`;
        dropZone.style.borderColor = '#8a2be2';
    };

    reader.readAsDataURL(file); // Запуск чтения файла
}

// ФУНКЦИЯ 1: Генерация новой строки ввода ссылки в форме
function createLinkInputRow(type = 'link', url = '') {
    const row = document.createElement('div');
    row.className = 'link-input-row';

    row.innerHTML = `
        <select class="link-type-select">
            <option value="link" ${type === 'link' ? 'selected' : ''}>Ссылка / Код</option>
            <option value="image" ${type === 'image' ? 'selected' : ''}>Картинка</option>
            <option value="youtube" ${type === 'youtube' ? 'selected' : ''}>YouTube</option>
        </select>
        <input type="text" class="link-url-input" placeholder="URL ресурса" value="${url}" required>
        <button type="button" class="remove-link-btn">✕</button>
    `;

    // Слушатель для удаления этой конкретной строки
    row.querySelector('.remove-link-btn').addEventListener('click', () => {
        row.remove();
    });

    linksFormContainer.appendChild(row);
}

// Слушатель кнопки "+" в форме — создает пустое поле по клику
addLinkFieldBtn.addEventListener('click', () => createLinkInputRow());

// Вспомогательная функция парсинга YouTube
function getYoutubeEmbedUrl(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
}

// ЛОГИКА 2: Сбор данных с формы (Создание ИЛИ Обновление)
projectForm.addEventListener('submit', function(event) {
    event.preventDefault();

    // 1. Извлекаем текстовые поля
    const title = document.getElementById('proj-title').value;
    const desc = document.getElementById('proj-desc').value;
    const status = document.getElementById('proj-status').value;

    // 2. Создаем ОДИН массив для всех ресурсов (и картинок, и ссылок)
    const resources = [];

    // 3. Проверяем, загрузил ли пользователь файл через drop-зону
    const uploadedImage = document.getElementById('proj-image-base64').value;
    if (uploadedImage) {
        resources.push({ type: 'image', url: uploadedImage });
    }

    // 4. Дособираем остальные динамические строки из контейнера (YouTube, ссылки)
    const rows = linksFormContainer.querySelectorAll('.link-input-row');
    rows.forEach(row => {
        const type = row.querySelector('.link-type-select').value;
        const url = row.querySelector('.link-url-input').value;
        if (url) resources.push({ type, url });
    });

    // 5. Сохраняем или обновляем проект в базе
    if (editModeId) {
        updateProject(editModeId, { title, desc, status, resources });
        editModeId = null;
        projectForm.querySelector('button').innerText = 'Добавить';
    } else {
        const id = Date.now().toString();
        saveProject({ id, title, desc, status, resources });
    }

    // 6. Полный сброс формы и интерфейса загрузки в дефолтное состояние
    projectForm.reset();
    
    hiddenImageInput.value = '';
    imagePreviewContainer.style.display = 'none';
    dropZoneText.innerText = '⤓ Перетащи сюда арт (PNG/JPG) или кликни для загрузки';
    dropZone.style.borderColor = '#3dac78';
    
    linksFormContainer.innerHTML = ''; // Очищаем динамические поля ресурсов
    loadProfile();
});

// ЛОГИКА 3: Отрисовка списка проектов в профиле
function loadProfile() {
    projectsListContainer.innerHTML = '';
    const projects = getProjectsFromStorage();

    if (projects.length === 0) {
        projectsListContainer.innerHTML = '<p style="color: #555;">Архив пуст. Сигналов нет.</p>';
        return;
    }

    projects.forEach(project => {
        const shortCard = document.createElement('div');
        shortCard.className = `project-card ${project.status}`;
        shortCard.style.cursor = 'pointer';
        
        shortCard.innerHTML = `
            <h3>${project.title} <small style="font-size: 12px;">[${project.status.toUpperCase()}]</small></h3>
        `;

        shortCard.addEventListener('click', () => {
            showProjectDetails(project.id);
        });

        projectsListContainer.appendChild(shortCard);
    });
}

// ЛОГИКА 4: Экран глубоких данных проекта с динамическим рендером МАССИВА МЕДИА
function showProjectDetails(projectId) {
    const projects = getProjectsFromStorage();
    const project = projects.find(p => p.id === projectId);

    if (!project) return;

    // Генерируем HTML для каждого ресурса в зависимости от его типа
    let mediaHTML = '';
    if (project.resources && project.resources.length > 0) {
        project.resources.forEach(res => {
            if (res.type === 'image') {
                mediaHTML += `
                    <div class="detail-media-block">
                        <img src="${res.url}" style="width: 100%; max-height: 400px; object-fit: contain; border: 1px solid #8a2be2; border-radius: 4px;">
                    </div>`;
            } else if (res.type === 'youtube') {
                const embed = getYoutubeEmbedUrl(res.url);
                if (embed) {
                    mediaHTML += `
                        <div class="detail-media-block" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border: 1px solid #3dac78; border-radius: 4px;">
                            <iframe src="${embed}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                        </div>
                        <p style="font-size: 13px; margin: 5px 0 20px 0;"><a href="${res.url}" target="_blank" style="color: #8a2be2;">Перейти на YouTube, если плеер заблокирован ➔</a></p>`;
                }
            } else {
                // Обычная ссылка или код
                mediaHTML += `<p class="detail-media-block">➔ <a href="${res.url}" target="_blank" style="color: #3dac78; font-weight: bold; text-decoration: underline;">Внешний ресурс / Исходный код</a></p>`;
            }
        });
    }

    detailsView.innerHTML = `
        <div class="project-details-content" style="border: 1px solid #3dac78; padding: 30px; background: #160d1f; border-radius: 8px; box-shadow: 0 0 15px rgba(61,172,120,0.2);">
            <h1 style="color: #3dac78; margin-top: 0;">${project.title}</h1>
            <p><strong>Статус системы:</strong> <span class="status-badge" style="color: #8a2be2;">${project.status}</span></p>
            <hr style="border-color: #8a2be2; margin: 20px 0;">
            
            <h3 style="color: #d8f3dc;">Бортовой журнал / Анализ:</h3>
            <p style="white-space: pre-wrap; color: #d8f3dc; background: #0c0512; padding: 15px; border-radius: 4px; border: 1px solid #3a2254;">${project.desc}</p>
            
            <h3 style="color: #d8f3dc; margin-top: 30px;">Прикрепленные ресурсы:</h3>
            <div class="project-resources-render-zone">
                ${mediaHTML || '<p style="color: #555;">Ресурсы не прикреплены.</p>'}
            </div>
            
            <div class="control-panel" style="margin-top: 40px; display: flex; gap: 15px;">
                <button id="edit-btn" style="background-color: #8a2be2; color: white; padding: 10px 20px;">Редактировать лог</button>
                <button id="delete-btn" style="background-color: #ff3333; color: white; padding: 10px 20px;">Уничтожить данные</button>
            </div>
        </div>
    `;

    profileView.style.display = 'none';
    detailsView.style.display = 'block';
    backBtn.style.display = 'block';

    document.getElementById('delete-btn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите безвозвратно удалить этот проект?')) {
            deleteProject(projectId);
        }
    });

    document.getElementById('edit-btn').addEventListener('click', () => {
        startEditing(project);
    });
}

// ЛОГИКА 5: Удаление
function deleteProject(projectId) {
    let projects = getProjectsFromStorage();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('myProjects', JSON.stringify(projects));
    backToProfile();
    loadProfile();
}

// ЛОГИКА 6: Переход в режим редактирования (Восстанавливает ВСЕ строки ресурсов)
function startEditing(project) {
    document.getElementById('proj-title').value = project.title;
    document.getElementById('proj-desc').value = project.desc;
    document.getElementById('proj-status').value = project.status;

    // Очищаем старые поля в форме и генерируем заново те, что были сохранены
    linksFormContainer.innerHTML = '';
    if (project.resources) {
        project.resources.forEach(res => createLinkInputRow(res.type, res.url));
    }

    editModeId = project.id;
    projectForm.querySelector('button').innerText = 'Сохранить изменения';
    backToProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProject(projectId, updatedData) {
    let projects = getProjectsFromStorage();
    const index = projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
        projects[index] = { id: projectId, ...updatedData };
        localStorage.setItem('myProjects', JSON.stringify(projects));
    }
}

function backToProfile() {
    profileView.style.display = 'block';
    detailsView.style.display = 'none';
    backBtn.style.display = 'none';
}

backBtn.addEventListener('click', backToProfile);

function getProjectsFromStorage() {
    return JSON.parse(localStorage.getItem('myProjects')) || [];
}

function saveProject(projectObj) {
    let projects = getProjectsFromStorage();
    projects.push(projectObj);
    localStorage.setItem('myProjects', JSON.stringify(projects));
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});