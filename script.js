// =============================================
// PathDataHub - Modern Dataset Management System
// Inspired by PathBench Architecture
// =============================================

// Global configuration
let config = {
    repoOwner: '',
    repoName: '',
    branchName: 'main',
    githubToken: '',
    dataFilePath: 'datasets.json'
};

let datasets = [];
let originalDatasets = [];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initMouseFollow();
    initTabs();
    initForm();
    loadConfig();
    initGitHubPanel();
    loadDatasets();
    
    // 开发时使用：按F2填充示例
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            fillExample();
            e.preventDefault();
        }
    });
});

// =============================================
// Mouse Follow Effect (PathBench Style)
// =============================================
function initMouseFollow() {
    const mouseFollowBg = document.querySelector('.mouse-follow-bg');
    if (!mouseFollowBg) return;

    const heroSection = document.querySelector('.hero-section');
    
    heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        mouseFollowBg.style.setProperty('--mouse-x', `${x}%`);
        mouseFollowBg.style.setProperty('--mouse-y', `${y}%`);
    });
}

// =============================================
// Tab System
// =============================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.hero-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // 移除所有active类
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // 添加active类
            btn.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // 如果是卡片视图或表格视图，刷新显示
            if (tabId === 'cards' || tabId === 'table') {
                displayDatasets();
            }
            
            // 平滑滚动到内容区域
            if (tabId !== 'cards') {
                setTimeout(() => {
                    targetTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });
    });
}

// =============================================
// Statistics Update
// =============================================
function updateStatistics() {
    // 过滤有效数据集（有名称的）
    const validDatasets = datasets.filter(d => d.dataset_name && d.dataset_name.trim() !== '');
    
    // 计算总数
    const totalDatasets = validDatasets.length;
    
    // 计算 VQA 数据集数量（data_type 包含 VQA 的）
    const totalVQAs = validDatasets.filter(d => 
        d.data_type && (d.data_type.toUpperCase().includes('VQA') || d.data_type === 'VQA')
    ).length;
    
    // 计算 WSI 数据集数量
    const totalWSIs = validDatasets.filter(d => 
        d.data_type && d.data_type === 'WSI'
    ).length;
    
    // 计算 ROI 数据集数量
    const totalROIs = validDatasets.filter(d => 
        d.data_type && d.data_type === 'ROI'
    ).length;
    
    // 执行动画效果更新数字
    animateCount('totalDatasets', totalDatasets);
    animateCount('totalVQAs', totalVQAs);
    animateCount('totalWSIs', totalWSIs);
    animateCount('totalROIs', totalROIs);
    
    // 如果需要调试，可以打印统计信息
    console.log('统计更新:', {
        总数: totalDatasets,
        VQA: totalVQAs,
        WSI: totalWSIs,
        ROI: totalROIs
    });
}

function animateCount(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// 初始化表单
function initForm() {
    const form = document.getElementById('datasetForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // 禁用提交按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            
            // 收集表单数据
            const formData = getFormData();
            
            // 验证数据
            if (!validateFormData(formData)) {
                throw new Error('请填写所有必填字段');
            }
            
            // 保存到GitHub
            await saveToGitHub(formData);
            
            // 显示成功消息
            toastr.success('数据集提交成功！');
            
            // 重置表单
            resetForm();
            
            // 重新加载数据集
            await loadDatasets();
            
        } catch (error) {
            console.error('提交失败:', error);
            toastr.error(`提交失败：${error.message}`);
        } finally {
            // 恢复提交按钮
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// 获取表单数据
function getFormData() {
    return {
        id: Date.now().toString(),
        data_type: document.getElementById('data_type').value,
        organ_chinese: document.getElementById('organ_chinese').value,
        organ_english: document.getElementById('organ_english').value,
        dataset_name: document.getElementById('dataset_name').value,
        dataset_status: document.getElementById('dataset_status').value,
        description_chinese: document.getElementById('description_chinese').value,
        description_english: document.getElementById('description_english').value,
        data_format: document.getElementById('data_format').value,
        data_scale: document.getElementById('data_scale').value,
        dataset_size: document.getElementById('dataset_size').value,
        download_link: document.getElementById('download_link').value,
        license: document.getElementById('license').value,
        commercial_use: document.querySelector('input[name="commercial_use"]:checked')?.value || '',
        local_storage: document.querySelector('input[name="local_storage"]:checked')?.value || '',
        local_path: document.getElementById('local_path').value,
        notes: document.getElementById('notes').value,
        created_at: new Date().toISOString()
    };
}

// 验证表单数据
function validateFormData(data) {
    const requiredFields = [
        'data_type',
        'organ_chinese',
        'organ_english',
        'dataset_name',
        'dataset_status',
        'description_chinese',
        'description_english',
        'data_format',
        'data_scale',
        'dataset_size'
    ];
    
    return requiredFields.every(field => data[field] && data[field].trim() !== '');
}

// 重置表单
function resetForm() {
    document.getElementById('datasetForm').reset();
}

// 填充示例数据
function fillExample() {
    const fields = {
        data_type: 'WSI',
        organ_chinese: '肝脏',
        organ_english: 'Liver',
        dataset_name: 'LiverCancer_WSI_Dataset_v1.0',
        dataset_status: '已标注',
        description_chinese: '包含1000张肝癌WSI图像，已由3位病理专家标注，包含肿瘤区域、坏死区域和正常组织区域。图像来源于2018-2022年的临床病例。',
        description_english: '1000 liver cancer WSI images annotated by 3 pathologists, including tumor regions, necrotic areas, and normal tissue. Images are from clinical cases between 2018-2022.',
        data_format: 'SVS',
        data_scale: '1000张WSI, 平均每张包含5个ROI区域',
        dataset_size: '500GB (压缩后300GB)',
        download_link: 'https://example.com/datasets/liver_cancer_v1.0.zip',
        license: 'CC BY-NC',
        local_path: '/data/WSI/liver_cancer_v1.0',
        notes: '数据集已通过质量控制，标注一致性达到85%以上。'
    };
    
    Object.keys(fields).forEach(key => {
        const element = document.getElementById(key);
        if (element) element.value = fields[key];
    });
    
    // 设置单选按钮
    document.querySelector('input[name="commercial_use"][value="否"]').checked = true;
    document.querySelector('input[name="local_storage"][value="是"]').checked = true;
    
    toastr.info('示例数据已填充');
}

// GitHub相关函数
function initGitHubPanel() {
    const toggleBtn = document.getElementById('configToggle');
    const configContent = document.getElementById('configContent');
    
    toggleBtn.addEventListener('click', () => {
        const isVisible = configContent.style.display === 'block';
        configContent.style.display = isVisible ? 'none' : 'block';
        toggleBtn.innerHTML = isVisible ? 
            '<i class="fas fa-cog"></i> GitHub配置' : 
            '<i class="fas fa-times"></i> 关闭配置';
    });
    
    // 初始化输入框
    document.getElementById('repoOwner').value = config.repoOwner;
    document.getElementById('repoName').value = config.repoName;
    document.getElementById('branchName').value = config.branchName;
    document.getElementById('githubToken').value = config.githubToken;
    document.getElementById('dataFilePath').value = config.dataFilePath;
}

// 保存GitHub配置
function saveGitHubConfig() {
    config = {
        repoOwner: document.getElementById('repoOwner').value.trim(),
        repoName: document.getElementById('repoName').value.trim(),
        branchName: document.getElementById('branchName').value.trim() || 'main',
        githubToken: document.getElementById('githubToken').value.trim(),
        dataFilePath: document.getElementById('dataFilePath').value.trim() || 'datasets.json'
    };
    
    localStorage.setItem('githubConfig', JSON.stringify(config));
    
    document.getElementById('configStatus').innerHTML = 
        '<div class="success">配置已保存到本地存储</div>';
    
    setTimeout(() => {
        document.getElementById('configStatus').innerHTML = '';
    }, 3000);
    
    toastr.success('GitHub配置已保存');
}

// 加载配置
function loadConfig() {
    const savedConfig = localStorage.getItem('githubConfig');
    if (savedConfig) {
        config = JSON.parse(savedConfig);
    }
}
// 触发GitHub Action
async function triggerRepositoryDispatch(formData) {
    // 移除敏感信息（本地路径等）
    const sanitizedData = { ...formData };
    if (sanitizedData.local_path) {
        sanitizedData.local_path = '保密路径';
    }
    
    const apiUrl = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/dispatches`;
    
    console.log('触发GitHub Action，URL:', apiUrl);
    console.log('提交的数据:', sanitizedData);
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `token ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            event_type: 'update_dataset',
            client_payload: sanitizedData
        })
    });
    
    console.log('GitHub API响应状态:', response.status);
    
    if (response.status === 204) {
        // 204 No Content 是成功的响应
        console.log('GitHub Action已成功触发');
        return true;
    }
    
    if (!response.ok) {
        let errorMessage = `HTTP错误: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // 无法解析JSON响应
        }
        
        // 特殊处理常见的GitHub API错误
        if (response.status === 401) {
            errorMessage = 'GitHub Token无效或已过期，请重新配置';
        } else if (response.status === 403) {
            errorMessage = '权限不足，请确保Token有足够的权限';
        } else if (response.status === 404) {
            errorMessage = '仓库不存在或没有访问权限';
        }
        
        throw new Error(errorMessage);
    }
    
    return response.ok;
}

// 本地存储相关函数
function saveToLocalStorage(formData) {
    const localData = JSON.parse(localStorage.getItem('wsi_datasets_local') || '[]');

    // 确保数据有ID和时间戳
    const dataWithMeta = {
        ...formData,
        id: formData.id || Date.now().toString(),
        created_at: formData.created_at || new Date().toISOString(),
        isLocal: true // 标记为本地数据
    };

    localData.push(dataWithMeta);
    localStorage.setItem('wsi_datasets_local', JSON.stringify(localData));

    // 同步到内存中的数据并立即刷新展示
    try {
        if (!datasets.find(d => d.id === dataWithMeta.id || d.dataset_name === dataWithMeta.dataset_name)) {
            datasets.unshift(dataWithMeta);
            originalDatasets = [...datasets];
            updateFilterOptions();
            displayDatasets();
        }
    } catch (e) {
        console.warn('更新内存数据失败', e);
    }

    console.log('已保存到本地存储，数据量:', localData.length);
}

function loadLocalDatasets() {
    return JSON.parse(localStorage.getItem('wsi_datasets_local') || '[]');
}

function syncLocalToGitHub() {
    const localData = loadLocalDatasets();
    if (localData.length === 0) {
        toastr.info('没有需要同步的本地数据');
        return;
    }
    
    // 显示同步选项
    showSyncModal(localData);
}

// 显示同步模态框
function showSyncModal(localDatasets) {
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    
    modalTitle.textContent = '同步本地数据到GitHub';
    
    let html = `
        <div class="sync-modal">
            <p><strong>发现 ${localDatasets.length} 个本地数据集</strong></p>
            <p>这些数据保存在您的浏览器本地，可以同步到GitHub仓库。</p>
            
            <div class="local-datasets">
                <h4>本地数据集列表：</h4>
                <table class="sync-table">
                    <thead>
                        <tr>
                            <th>选择</th>
                            <th>数据集名称</th>
                            <th>器官</th>
                            <th>数据格式</th>
                            <th>保存时间</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    localDatasets.forEach((dataset, index) => {
        html += `
            <tr>
                <td><input type="checkbox" id="dataset-${index}" checked></td>
                <td>${dataset.dataset_name}</td>
                <td>${dataset.organ_chinese}</td>
                <td>${dataset.data_format}</td>
                <td>${new Date(dataset.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
                
                <div class="sync-actions">
                    <button class="btn btn-primary" onclick="syncSelectedDatasets()">
                        <i class="fas fa-cloud-upload-alt"></i> 同步选中的数据
                    </button>
                    <button class="btn btn-secondary" onclick="exportLocalData()">
                        <i class="fas fa-download"></i> 导出为JSON文件
                    </button>
                    <button class="btn btn-danger" onclick="clearLocalData()">
                        <i class="fas fa-trash"></i> 清空本地数据
                    </button>
                </div>
                
                <div class="sync-note">
                    <p><strong>注意：</strong>同步操作可能需要一些时间，请勿关闭页面。</p>
                </div>
            </div>
        </div>
    `;
    
    modalBody.innerHTML = html;
    document.getElementById('datasetModal').style.display = 'flex';
}

// 同步选中的数据
async function syncSelectedDatasets() {
    const localDatasets = loadLocalDatasets();
    const selectedDatasets = [];
    
    // 获取选中的数据集
    localDatasets.forEach((dataset, index) => {
        const checkbox = document.getElementById(`dataset-${index}`);
        if (checkbox && checkbox.checked) {
            selectedDatasets.push(dataset);
        }
    });
    
    if (selectedDatasets.length === 0) {
        toastr.warning('请至少选择一个数据集进行同步');
        return;
    }
    
    toastr.info(`正在同步 ${selectedDatasets.length} 个数据集...`);
    
    // 逐个同步数据集
    let successCount = 0;
    let failCount = 0;
    
    for (const dataset of selectedDatasets) {
        try {
            await triggerRepositoryDispatch(dataset);
            successCount++;
            toastr.success(`已同步: ${dataset.dataset_name}`);
            
            // 成功同步后从本地存储中移除
            removeFromLocalStorage(dataset.id);
            
            // 短暂延迟避免速率限制
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            failCount++;
            console.error(`同步失败 ${dataset.dataset_name}:`, error);
            toastr.error(`同步失败: ${dataset.dataset_name}`);
        }
    }
    
    // 关闭模态框
    document.getElementById('datasetModal').style.display = 'none';
    
    // 显示最终结果
    if (failCount === 0) {
        toastr.success(`成功同步 ${successCount} 个数据集到GitHub！`);
    } else {
        toastr.warning(`同步完成：成功 ${successCount} 个，失败 ${failCount} 个`);
    }
    
    // 重新加载数据
    loadDatasets();
}

// 从本地存储移除数据
function removeFromLocalStorage(datasetId) {
    const localData = loadLocalDatasets();
    const updatedData = localData.filter(dataset => dataset.id !== datasetId);
    localStorage.setItem('wsi_datasets_local', JSON.stringify(updatedData));
}

// 清除所有本地数据
function clearAllLocalData() {
    if (confirm('确定要清除所有本地保存的数据集吗？\n\n注意：此操作不可恢复，只会删除本地浏览器中的数据，不会影响GitHub仓库中的数据。')) {
        // 清除本地存储
        localStorage.removeItem('wsi_datasets_local');
        
        // 从内存中移除本地数据
        datasets = datasets.filter(d => !d.isLocal);
        originalDatasets = originalDatasets.filter(d => !d.isLocal);
        
        // 刷新显示
        displayDatasets();
        displayTable();
        updateStatistics();
        
        toastr.success('本地数据已清除！');
    }
}

// 保存数据到GitHub
async function saveToGitHub(formData) {
    if (!config.githubToken || !config.repoOwner || !config.repoName) {
        throw new Error('请先配置GitHub信息');
    }
    
    try {
        // 验证表单数据
        if (!validateFormData(formData)) {
            throw new Error('请填写所有必填字段');
        }
        
        // 使用GitHub Contents API直接更新datasets.json文件
        await updateDatasetsJsonFile(formData);
        
        // 显示成功消息
        toastr.success('数据集已成功提交到GitHub仓库！');
        
        // 稍后自动刷新数据
        setTimeout(() => {
            loadDatasets();
        }, 2000); // 2秒后刷新
        
    } catch (error) {
        console.error('提交失败:', error);
        
        // 如果GitHub提交失败，保存到本地存储
        saveToLocalStorage(formData);
        toastr.warning('GitHub提交失败，数据已保存到本地。');
        toastr.info('您可以稍后手动同步到GitHub。');
        
        // 立即刷新显示
        loadDatasets();
    }
    
    // 重置表单
    resetForm();
}

// 使用GitHub Contents API直接更新datasets.json文件
async function updateDatasetsJsonFile(newDataset) {
    const filePath = 'datasets.json';
    const apiUrl = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${filePath}`;
    
    console.log('正在更新datasets.json文件...');
    
    // 步骤1: 获取当前文件内容和SHA
    const getResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `token ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!getResponse.ok) {
        throw new Error(`无法获取文件: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const fileData = await getResponse.json();
    const currentSha = fileData.sha;
    
    // 步骤2: 解码当前文件内容
    const currentContent = decodeBase64(fileData.content);
    let datasets = JSON.parse(currentContent);
    
    // 步骤3: 添加新数据集
    // 确保新数据集有必要的字段
    const datasetToAdd = {
        ...newDataset,
        id: newDataset.id || Date.now().toString(),
        created_at: newDataset.created_at || new Date().toISOString()
    };
    
    // 添加到数组开头
    datasets.unshift(datasetToAdd);
    
    // 步骤4: 编码新内容为base64
    const newContent = JSON.stringify(datasets, null, 2);
    const encodedContent = encodeBase64(newContent);
    
    // 步骤5: 更新文件
    const updateResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Add new dataset: ${datasetToAdd.dataset_name}`,
            content: encodedContent,
            sha: currentSha,
            branch: 'main' // 或 'master'，根据你的仓库默认分支
        })
    });
    
    if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`更新文件失败: ${errorData.message || updateResponse.statusText}`);
    }
    
    console.log('datasets.json文件更新成功！');
    return await updateResponse.json();
}

// Base64编码函数
function encodeBase64(str) {
    // 处理Unicode字符
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    utf8Bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

// Base64解码函数
function decodeBase64(base64Str) {
    // 移除换行符
    const cleanBase64 = base64Str.replace(/\n/g, '');
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

// 触发GitHub Action
async function triggerRepositoryDispatch(formData) {
    // 移除敏感信息（本地路径等）
    const sanitizedData = { ...formData };
    if (sanitizedData.local_path) {
        sanitizedData.local_path = '保密路径';
    }
    
    const apiUrl = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/dispatches`;
    
    console.log('触发GitHub Action，URL:', apiUrl);
    console.log('提交的数据:', sanitizedData);
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `token ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            event_type: 'update_dataset',
            client_payload: sanitizedData
        })
    });
    
    console.log('GitHub API响应状态:', response.status);
    
    if (response.status === 204) {
        // 204 No Content 是成功的响应
        console.log('GitHub Action已成功触发');
        return true;
    }
    
    if (!response.ok) {
        let errorMessage = `HTTP错误: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // 无法解析JSON响应
        }
        
        // 特殊处理常见的GitHub API错误
        if (response.status === 401) {
            errorMessage = 'GitHub Token无效或已过期，请重新配置';
        } else if (response.status === 403) {
            errorMessage = '权限不足，请确保Token有足够的权限';
        } else if (response.status === 404) {
            errorMessage = '仓库不存在或没有访问权限';
        }
        
        throw new Error(errorMessage);
    }
    
    return response.ok;
}
// 更新GitHub文件
async function updateGitHubFile(data) {
    const apiUrl = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.dataFilePath}`;
    
    // 获取文件的SHA（如果存在）
    let sha = '';
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${config.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const fileInfo = await response.json();
            sha = fileInfo.sha;
        }
    } catch (error) {
        // 文件不存在，将创建新文件
    }
    
    // 更新文件
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const body = {
        message: `添加数据集: ${data[data.length - 1].dataset_name}`,
        content: content,
        branch: config.branchName
    };
    
    if (sha) {
        body.sha = sha;
    }
    
    const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${config.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '更新GitHub文件失败');
    }
}

// 从GitHub加载数据集
async function loadDatasets() {
    try {
        let remoteDatasets = [];

        // 优先尝试从已配置的GitHub仓库加载
        if (config.repoOwner && config.repoName) {
            try {
                remoteDatasets = await fetchDatasets();
            } catch (err) {
                console.warn('从GitHub加载失败，尝试后备加载：', err);
            }
        } else {
            // 如果没有配置GitHub，尝试加载工作目录下的 datasets.json
            try {
                const resp = await fetch(config.dataFilePath || 'datasets.json');
                if (resp.ok) {
                    remoteDatasets = await resp.json();
                }
            } catch (err) {
                console.warn('本地 datasets.json 加载失败：', err);
            }
        }

        // 加载浏览器本地保存的数据（离线提交）
        const local = loadLocalDatasets();

        // 合并：优先保留远端数据，补充本地数据（按 id 或名称去重）
        const merged = Array.isArray(remoteDatasets) ? [...remoteDatasets] : [];
        for (const item of local) {
            if (!merged.find(d => (d.id && d.id === item.id) || d.dataset_name === item.dataset_name)) {
                merged.push(item);
            }
        }

        datasets = merged;
        originalDatasets = [...datasets];

        // 更新统计信息（PathBench风格）
        updateStatistics();
        
        // 更新筛选器选项并显示
        updateFilterOptions();
        displayDatasets();

        toastr.success(`已加载 ${datasets.length} 个数据集`);
    } catch (error) {
        console.error('加载数据集失败:', error);
        toastr.error('加载数据集失败，已回退到本地数据');

        // 回退到仅使用本地存储的数据
        datasets = loadLocalDatasets();
        originalDatasets = [...datasets];
        updateFilterOptions();
        displayDatasets();
    }
}

// 从GitHub获取数据集
async function fetchDatasets() {
    if (!config.repoOwner || !config.repoName) {
        throw new Error('请先配置GitHub仓库信息');
    }
    
    const rawUrl = `https://raw.githubusercontent.com/${config.repoOwner}/${config.repoName}/${config.branchName}/${config.dataFilePath}`;
    
    const response = await fetch(rawUrl);
    
    if (!response.ok) {
        if (response.status === 404) {
            return []; // 文件不存在，返回空数组
        }
        throw new Error(`HTTP错误: ${response.status}`);
    }
    
    return await response.json();
}

// 更新筛选器选项
function updateFilterOptions() {
    const organFilter = document.getElementById('filterOrgan');
    
    // 收集所有器官
    const organs = [...new Set(datasets.map(d => d.organ_chinese))];
    
    // 清空现有选项（保留第一个）
    while (organFilter.options.length > 1) {
        organFilter.remove(1);
    }
    
    // 添加新选项
    organs.forEach(organ => {
        if (organ) {
            const option = document.createElement('option');
            option.value = organ;
            option.textContent = organ;
            organFilter.appendChild(option);
        }
    });
}

// 显示数据集
function displayDatasets() {
    displayCards();
    displayTable();
}

// 显示卡片
function displayCards() {
    const container = document.getElementById('cardsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (datasets.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // 应用筛选
    let filteredDatasets = filterDatasets();
    
    // 过滤掉空数据集（没有名称的）
    filteredDatasets = filteredDatasets.filter(d => d.dataset_name && d.dataset_name.trim() !== '');
    
    if (filteredDatasets.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>没有匹配的数据集</h3><p>尝试不同的筛选条件</p></div>';
        return;
    }
    
    // 生成卡片HTML
    container.innerHTML = filteredDatasets.map(dataset => createCardHTML(dataset)).join('');
    
    // 为查看详情按钮添加事件监听
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const datasetId = this.getAttribute('data-id');
            showDatasetDetail(datasetId);
        });
    });
    
    // 为下载按钮添加事件监听
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const downloadUrl = this.getAttribute('data-url');
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                toastr.info('此数据集暂无下载链接');
            }
        });
    });
}

// 筛选数据集
function filterDatasets() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    const filterOrgan = document.getElementById('filterOrgan').value;
    
    // 首先过滤掉空数据集
    const validDatasets = datasets.filter(d => d.dataset_name && d.dataset_name.trim() !== '');
    
    return validDatasets.filter(dataset => {
        // 搜索筛选
        if (searchTerm) {
            const searchFields = [
                dataset.dataset_name,
                dataset.organ_chinese,
                dataset.organ_english,
                dataset.description_chinese,
                dataset.description_english
            ].join(' ').toLowerCase();
            
            if (!searchFields.includes(searchTerm)) {
                return false;
            }
        }
        
        // 类型筛选
        if (filterType && dataset.data_type !== filterType) {
            return false;
        }
        
        // 器官筛选
        if (filterOrgan && dataset.organ_chinese !== filterOrgan) {
            return false;
        }
        
        return true;
    });
}

// 创建卡片HTML
function createCardHTML(dataset) {
    const typeColors = {
        'VQA': '#8b5cf6',  // 紫色
        'WSI': '#6366f1',  // 靛蓝色
        'ROI': '#06b6d4'   // 青色
    };
    
    const typeColor = typeColors[dataset.data_type] || '#6c757d';
    
    const licenseBadge = dataset.license ? 
        `<span class="meta-item"><i class="fas fa-file-contract"></i> ${dataset.license}</span>` : '';
    
    const commercialBadge = dataset.commercial_use ? 
        `<span class="meta-item ${dataset.commercial_use === '是' ? 'success' : 'warning'}">
            <i class="fas ${dataset.commercial_use === '是' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            商用: ${dataset.commercial_use}
        </span>` : '';
    
    const storageBadge = dataset.local_storage ?
        `<span class="meta-item ${dataset.local_storage === '是' ? 'info' : 'secondary'}">
            <i class="fas ${dataset.local_storage === '是' ? 'fa-hdd' : 'fa-cloud'}"></i>
            存储: ${dataset.local_storage}
        </span>` : '';
    
    return `
        <div class="dataset-card">
            <div class="card-header" style="border-top-color: ${typeColor}">
                <div class="card-type" style="background: ${typeColor}">${dataset.data_type}</div>
                <div class="card-status">${dataset.dataset_status}</div>
            </div>
            
            <h3 class="card-title">${dataset.dataset_name}</h3>
            
            <div class="card-organ">
                <i class="fas fa-lungs"></i>
                <span>${dataset.organ_chinese} (${dataset.organ_english})</span>
            </div>
            
            <div class="card-body">
                <p class="card-description">${dataset.description_chinese}</p>
                
                <div class="card-meta">
                    <span class="meta-item">
                        <i class="fas fa-file-image"></i> ${dataset.data_format}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-expand-arrows-alt"></i> ${dataset.data_scale}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-hdd"></i> ${dataset.dataset_size}
                    </span>
                    ${licenseBadge}
                    ${commercialBadge}
                    ${storageBadge}
                </div>
            </div>
            
            <div class="card-footer">
                <div class="card-license">
                    <i class="far fa-calendar-alt"></i>
                    ${new Date(dataset.created_at).toLocaleDateString('zh-CN')}
                </div>
                <div class="card-actions">
                    <button class="action-btn view-btn" data-id="${dataset.id}">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="action-btn download-btn" data-url="${dataset.download_link}">
                        <i class="fas fa-download"></i> 下载
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 显示表格
function displayTable() {
    const tableBody = document.getElementById('tableBody');
    
    if (datasets.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">暂无数据</td></tr>';
        return;
    }
    
    let filteredDatasets = filterDatasets();
    
    tableBody.innerHTML = filteredDatasets.map(dataset => `
        <tr>
            <td><span class="badge badge-${dataset.data_type.toLowerCase()}">${dataset.data_type}</span></td>
            <td>${dataset.organ_chinese}</td>
            <td><strong>${dataset.dataset_name}</strong></td>
            <td title="${dataset.description_chinese}">${dataset.description_chinese.length > 40 ? dataset.description_chinese.substring(0, 40) + '...' : dataset.description_chinese}</td>
            <td>${dataset.dataset_status}</td>
            <td>${dataset.data_format}</td>
            <td>${dataset.data_scale}</td>
            <td>
                <button class="btn-sm btn-info" onclick="showDatasetDetail('${dataset.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 显示数据集详情
function showDatasetDetail(datasetId) {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;
    
    const modal = document.getElementById('datasetModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = dataset.dataset_name;
    
    const typeColors = {
        'VQA': '#8b5cf6',  // 紫色
        'WSI': '#2563eb',  // 蓝色
        'ROI': '#0ea5e9',  // 天空蓝
        'Both': '#10b981'  // 绿色
    };
    
    const typeColor = typeColors[dataset.data_type] || '#6c757d';
    
    modalBody.innerHTML = `
        <div class="detail-header" style="border-left-color: ${typeColor}">
            <div class="detail-type" style="background: ${typeColor}">${dataset.data_type}</div>
            <div class="detail-organ">
                <i class="fas fa-lungs"></i>
                ${dataset.organ_chinese} (${dataset.organ_english})
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-info-circle"></i> 基本信息</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>数据集名称:</strong> ${dataset.dataset_name}
                </div>
                <div class="detail-item">
                    <strong>处理状态:</strong> ${dataset.dataset_status}
                </div>
                <div class="detail-item">
                    <strong>数据格式:</strong> ${dataset.data_format}
                </div>
                <div class="detail-item">
                    <strong>数据规模:</strong> ${dataset.data_scale}
                </div>
                <div class="detail-item">
                    <strong>数据集大小:</strong> ${dataset.dataset_size}
                </div>
                <div class="detail-item">
                    <strong>创建时间:</strong> ${new Date(dataset.created_at).toLocaleString('zh-CN')}
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-align-left"></i> 数据集描述</h4>
            <div class="detail-description">
                <h5>中文描述:</h5>
                <p>${dataset.description_chinese}</p>
                
                <h5>英文描述:</h5>
                <p>${dataset.description_english}</p>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-shield-alt"></i> 权限与存储</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>License:</strong> ${dataset.license || '未指定'}
                </div>
                <div class="detail-item">
                    <strong>是否可商用:</strong> 
                    <span class="badge ${dataset.commercial_use === '是' ? 'badge-success' : 'badge-warning'}">
                        ${dataset.commercial_use || '未知'}
                    </span>
                </div>
                <div class="detail-item">
                    <strong>本地是否存储:</strong> ${dataset.local_storage || '未知'}
                </div>
                <div class="detail-item">
                    <strong>本地路径:</strong> ${dataset.local_path || '未指定'}
                </div>
            </div>
        </div>
        
        ${dataset.download_link ? `
        <div class="detail-section">
            <h4><i class="fas fa-download"></i> 下载链接</h4>
            <a href="${dataset.download_link}" target="_blank" class="download-link">
                <i class="fas fa-external-link-alt"></i> ${dataset.download_link}
            </a>
        </div>
        ` : ''}
        
        ${dataset.notes ? `
        <div class="detail-section">
            <h4><i class="fas fa-sticky-note"></i> 备注</h4>
            <p>${dataset.notes}</p>
        </div>
        ` : ''}
        
        <div class="detail-actions">
            <button class="btn btn-primary" onclick="window.open('${dataset.download_link}', '_blank')" ${!dataset.download_link ? 'disabled' : ''}>
                <i class="fas fa-download"></i> 下载数据集
            </button>
            <button class="btn btn-secondary close-modal">
                <i class="fas fa-times"></i> 关闭
            </button>
        </div>
    `;
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 添加关闭事件
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 导出为CSV
function exportToCSV() {
    if (datasets.length === 0) {
        toastr.warning('没有数据可导出');
        return;
    }
    
    const headers = [
        '数据类型', '器官（中文）', '器官（英文）', '数据集名称', '数据集处理状态',
        '数据集描述(中文)', '数据集描述(英文)', '数据格式', '数据规模', '数据集大小',
        '下载链接', '数据集License', '是否可商用', '本地是否存储', '本地路径', '数据集备注'
    ];
    
    const rows = datasets.map(dataset => [
        dataset.data_type,
        dataset.organ_chinese,
        dataset.organ_english,
        dataset.dataset_name,
        dataset.dataset_status,
        dataset.description_chinese,
        dataset.description_english,
        dataset.data_format,
        dataset.data_scale,
        dataset.dataset_size,
        dataset.download_link || '',
        dataset.license || '',
        dataset.commercial_use || '',
        dataset.local_storage || '',
        dataset.local_path || '',
        dataset.notes || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wsi_datasets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toastr.success('CSV文件已生成并开始下载');
}

// 显示空状态
function showEmptyState() {
    document.getElementById('cardsContainer').innerHTML = '';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('tableBody').innerHTML = '<tr><td colspan="8" class="text-center">暂无数据</td></tr>';
}

// 搜索和筛选事件监听
document.getElementById('searchInput').addEventListener('input', displayDatasets);
document.getElementById('filterType').addEventListener('change', displayDatasets);
document.getElementById('filterOrgan').addEventListener('change', displayDatasets);

// 统计卡片点击事件监听
function initStatCardClickEvents() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const dataType = card.getAttribute('data-type');
            
            // 切换到卡片视图
            const cardsTab = document.querySelector('[data-tab="cards"]');
            if (cardsTab) {
                cardsTab.click();
            }
            
            // 设置筛选器
            const filterType = document.getElementById('filterType');
            if (filterType) {
                filterType.value = dataType;
                displayDatasets();
            }
            
            // 更新激活状态
            statCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
}

// 初始化统计卡片点击事件
setTimeout(initStatCardClickEvents, 500);

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
    .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    
    .badge-wsi { background: #4a6fa5; color: white; }
    .badge-roi { background: #28a745; color: white; }
    .badge-both { background: #ffc107; color: black; }
    
    .badge-success { background: #28a745; color: white; }
    .badge-warning { background: #ffc107; color: black; }
    .badge-info { background: #17a2b8; color: white; }
    .badge-secondary { background: #6c757d; color: white; }
    
    .btn-sm {
        padding: 5px 10px;
        font-size: 0.85rem;
    }
    
    .detail-header {
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid;
    }
    
    .detail-type {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        color: white;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 10px;
    }
    
    .detail-organ {
        font-size: 1.1rem;
        color: #333;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .detail-section {
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
    }
    
    .detail-section h4 {
        color: #4a6fa5;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 15px;
    }
    
    .detail-item {
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
    }
    
    .detail-description h5 {
        color: #555;
        margin: 15px 0 8px;
    }
    
    .detail-description p {
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        line-height: 1.6;
    }
    
    .download-link {
        display: block;
        padding: 12px;
        background: #e7f3ff;
        border-radius: 6px;
        color: #0066cc;
        text-decoration: none;
        word-break: break-all;
    }
    
    .download-link:hover {
        background: #d0e7ff;
        text-decoration: underline;
    }
    
    .detail-actions {
        display: flex;
        gap: 15px;
        margin-top: 30px;
        justify-content: flex-end;
    }
    
    .text-center { text-align: center; }
`;
document.head.appendChild(style);

// 初始化Toastr
toastr.options = {
    positionClass: 'toast-top-right',
    progressBar: true,
    timeOut: 5000,
    extendedTimeOut: 1000
};