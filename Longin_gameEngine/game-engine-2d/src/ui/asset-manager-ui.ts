export interface Asset {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  path: string;
  tags: string[];
}

export class AssetManagerUI {
  private container: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private assetList: HTMLElement | null = null;
  private onAssetSelect?: (asset: Asset) => void;

  constructor(onAssetSelect?: (asset: Asset) => void) {
    this.onAssetSelect = onAssetSelect;
    this.createModal();
  }

  private createModal(): void {
    // Modal Overlay
    this.modal = document.createElement('div');
    this.modal.style.position = 'fixed';
    this.modal.style.top = '0';
    this.modal.style.left = '0';
    this.modal.style.width = '100%';
    this.modal.style.height = '100%';
    this.modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.modal.style.display = 'none';
    this.modal.style.justifyContent = 'center';
    this.modal.style.alignItems = 'center';
    this.modal.style.zIndex = '1000';

    // Modal Content
    const content = document.createElement('div');
    content.style.backgroundColor = '#333';
    content.style.padding = '20px';
    content.style.borderRadius = '8px';
    content.style.width = '600px';
    content.style.height = '500px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.color = 'white';
    this.modal.appendChild(content);

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '15px';
    
    const title = document.createElement('h2');
    title.innerText = 'Asset Manager';
    title.style.margin = '0';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'X';
    closeBtn.onclick = () => this.hide();
    header.appendChild(closeBtn);
    content.appendChild(header);

    // Upload Area
    const uploadArea = document.createElement('div');
    uploadArea.style.border = '2px dashed #666';
    uploadArea.style.padding = '20px';
    uploadArea.style.textAlign = 'center';
    uploadArea.style.marginBottom = '15px';
    uploadArea.style.cursor = 'pointer';
    uploadArea.innerText = 'Drag & Drop files here or Click to Upload';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    fileInput.accept = 'image/*,application/json';
    uploadArea.appendChild(fileInput);

    uploadArea.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            this.uploadFile(files[0]);
        }
    };

    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#aaa';
    };

    uploadArea.ondragleave = (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#666';
    };

    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#666';
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            this.uploadFile(e.dataTransfer.files[0]);
        }
    };

    content.appendChild(uploadArea);

    // Asset List
    this.assetList = document.createElement('div');
    this.assetList.style.flex = '1';
    this.assetList.style.overflowY = 'auto';
    this.assetList.style.display = 'grid';
    this.assetList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
    this.assetList.style.gap = '10px';
    content.appendChild(this.assetList);

    document.body.appendChild(this.modal);
  }

  public show(): void {
    if (this.modal) {
        this.modal.style.display = 'flex';
        this.fetchAssets();
    }
  }

  public hide(): void {
    if (this.modal) {
        this.modal.style.display = 'none';
    }
  }

  private async fetchAssets(): Promise<void> {
    try {
        const response = await fetch('/api/assets');
        if (response.ok) {
            const assets: Asset[] = await response.json();
            this.renderAssets(assets);
        }
    } catch (error) {
        console.error('Failed to fetch assets:', error);
    }
  }

  private renderAssets(assets: Asset[]): void {
    if (!this.assetList) return;
    this.assetList.innerHTML = '';

    assets.forEach(asset => {
        const item = document.createElement('div');
        item.style.backgroundColor = '#444';
        item.style.padding = '5px';
        item.style.borderRadius = '4px';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'center';

        const img = document.createElement('img');
        img.src = asset.path;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '80px';
        img.style.objectFit = 'contain';
        img.style.marginBottom = '5px';
        item.appendChild(img);

        const name = document.createElement('div');
        name.innerText = asset.original_name;
        name.style.fontSize = '10px';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';
        name.style.whiteSpace = 'nowrap';
        name.style.width = '100%';
        name.style.textAlign = 'center';
        item.appendChild(name);

        item.onclick = () => {
            if (this.onAssetSelect) {
                this.onAssetSelect(asset);
                this.hide();
            }
        };

        this.assetList!.appendChild(item);
    });
  }

  private async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tags', JSON.stringify(['user-upload']));

    try {
        const response = await fetch('/api/assets/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            await this.fetchAssets();
        } else {
            alert('Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload error');
    }
  }
}
