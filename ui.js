import { getYoutubeEmbedUrl } from './helpers.js';

// Генерация новой строки ввода ресурса в форме
export function createLinkInputRow(container, type = 'link', url = '') {
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

    row.querySelector('.remove-link-btn').addEventListener('click', () => {
        row.remove();
    });

    container.appendChild(row);
}

// Генерация HTML-контента для всех ресурсов на экране деталей
export function renderMediaHTML(resources) {
    let mediaHTML = '';
    if (!resources || resources.length === 0) return '';

    resources.forEach(res => {
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
            mediaHTML += `<p class="detail-media-block">➔ <a href="${res.url}" target="_blank" style="color: #3dac78; font-weight: bold; text-decoration: underline;">Внешний ресурс / Исходный код</a></p>`;
        }
    });

    return mediaHTML;
}