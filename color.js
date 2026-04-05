class ColorPickerMenu extends HTMLElement {
  constructor(calendar) {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.selectedColor = '#ff4444'; // 默认红色
    this.currentCalendar = calendar;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }


  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (this.shadowRoot.contains(e.target) && this.isOpen) {
        this.closeMenu();
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .menu-container {
          width: 100%;
          font-family: sans-serif;
        }
        
        /* 下拉菜单横条 - 占据100%宽度 */
        .menu-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s;
          user-select: none;
        }
        
        .menu-bar:hover {
          background: #e0e0e0;
        }
        
        .menu-bar.active {
          background: #e0e0e0;
          border-color: #007bff;
        }
        
        .menu-text {
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .color-preview {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px #ddd;
        }
        
        .arrow {
          transition: transform 0.2s;
          font-size: 12px;
        }
        
        .arrow.open {
          transform: rotate(180deg);
        }
        
        /* 下拉面板 - 不脱离文档流 */
        .dropdown-panel {
          margin-top: 8px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 16px;
          width: 100%;
          box-sizing: border-box;
          display: none;
        }
        
        .dropdown-panel.open {
          display: block;
        }
        
        /* 调色板 */
        .palette-title {
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;
          font-weight: 500;
        }
        
        .color-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        
        .color-option {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .color-option:hover {
          transform: scale(1.05);
        }
        
        .color-option.selected {
          border-color: #333;
          box-shadow: 0 0 0 2px white, 0 0 0 4px #333;
        }
      </style>
      
      <div class="menu-container">
        <div class="menu-bar" id="menuBar">
          <div class="menu-text">
            <div class="color-preview" style="background: ${this.selectedColor}"></div>
            <span>选择圆圈颜色</span>
          </div>
          <div class="arrow ${this.isOpen ? 'open' : ''}">▼</div>
        </div>
        
        <div class="dropdown-panel ${this.isOpen ? 'open' : ''}" id="dropdownPanel">
        <div class="color-input-wrapper">
          <span class="color-label">选择颜色：</span>
          <input type="color" id="colorPicker" value="${this.selectedColor}">
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }
  
  
  bindEvents() {
    // 菜单栏点击
    const menuBar = this.shadowRoot.getElementById('menuBar');
    menuBar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });
    
    // 颜色选项点击
      const colorPicker = this.shadowRoot.getElementById('colorPicker');
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      this.selectColor(e.target.value);
    });
  }
  }
  
  toggleMenu() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      // 打开面板时开启标注模式
      this.enableMarkingMode();
    } else {
      // 关闭面板时关闭标注模式
      this.disableMarkingMode();
    }
    
    this.render();
  }
  
  closeMenu() {
    if (this.isOpen) {
      this.isOpen = false;
      this.disableMarkingMode();
      this.render();
    }
  }
  
  enableMarkingMode() {
    if (this.currentCalendar) {
      this.currentCalendar.enableMarkingMode(this.selectedColor);
      this.dispatchEvent(new CustomEvent('markingstart', {
        detail: { color: this.selectedColor },
        bubbles: true
      }));
    }
  }
  
  disableMarkingMode() {
    if (this.currentCalendar) {
      this.currentCalendar.disableMarkingMode();
      this.dispatchEvent(new CustomEvent('markingend', {
        bubbles: true
      }));
    }
  }
  
  selectColor(color) {
    this.selectedColor = color;
    this.render();
    
    // 如果标注模式已开启，更新圆圈颜色
    if (this.isOpen && this.currentCalendar) {
      this.currentCalendar.setCircleColor(color);
    }
    
    // 触发颜色改变事件
    this.dispatchEvent(new CustomEvent('colorchange', {
      detail: { color: color },
      bubbles: true
    }));
  }
  
  // 供外部调用
  setCalendar(calendarElement) {
    this.currentCalendar = calendarElement;
  }
  
  getSelectedColor() {
    return this.selectedColor;
  }
  
  isMarkingMode() {
    return this.isOpen;
  }
}

customElements.define('color-picker-menu', ColorPickerMenu);