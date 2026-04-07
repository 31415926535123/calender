class CalendarExcel extends HTMLElement {
  // 默认参数实现兼容：默认7个单元格，默认值使用原来的星期文本
  constructor(cellsCount = 7, defaultValues = ['日', '一', '二', '三', '四', '五', '六']) {
    super();
    this.attachShadow({ mode: 'open' });
    
    // 存储内部状态
    this._cellsCount = cellsCount;
    this._defaultValues = defaultValues;
    this._cellValues = [];
    this.readOnly=true;
    // 初始化单元格值数组
    this._initCellValues();
  }

  static get observedAttributes() {
    return ['cells'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'cells' && oldValue !== newValue) {
      const parsed = parseInt(newValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.setCells(parsed);
      }
    }
  }

  connectedCallback() {
    this.render();
  }

  // 初始化单元格值数组
  _initCellValues() {
    this._cellValues = [];
    for (let i = 0; i < this._cellsCount; i++) {
      if (this._defaultValues && i < this._defaultValues.length) {
        this._cellValues[i] = this._defaultValues[i];
      } else {
        this._cellValues[i] = '';
      }
    }
  }

  // 暴露方法：调整单元格格数
  setCells(count) {
    if (typeof count !== 'number' || count <= 0 || isNaN(count)) {
      console.warn('setCells: count must be a positive number');
      return;
    }
    
    const oldCount = this._cellsCount;
    this._cellsCount = count;
    
    // 调整单元格值数组
    const newValues = [];
    for (let i = 0; i < count; i++) {
      if (i < oldCount) {
        newValues[i] = this._cellValues[i] || '';
      } else {
        newValues[i] = '';
      }
    }
    this._cellValues = newValues;
    
    // 更新属性
    this.setAttribute('cells', count.toString());
    
    // 重新渲染
    this.render();
  }

  // 暴露方法：修改指定位置的值（索引从0开始）
  setCellValue(index, value) {
    if (typeof index !== 'number' || index < 0 || index >= this._cellsCount) {
      console.warn(`setCellValue: index ${index} out of range (0-${this._cellsCount - 1})`);
      return false;
    }
    
    if (value === undefined || value === null) {
      console.warn('setCellValue: value cannot be null or undefined');
      return false;
    }
    
    // 更新内部数组
    this._cellValues[index] = String(value);
    
    // 如果已经渲染，直接更新对应的textarea
    if (this.shadowRoot && this.shadowRoot.querySelectorAll) {
      const textareas = this.shadowRoot.querySelectorAll('textarea');
      if (textareas[index]) {
        textareas[index].value = String(value);
        // 触发调整高度
        const event = new Event('input', { bubbles: true });
        textareas[index].dispatchEvent(event);
      }
    }
    
    return true;
  }

  // 获取指定位置的值
  getCellValue(index) {
    if (typeof index !== 'number' || index < 0 || index >= this._cellsCount) {
      console.warn(`getCellValue: index ${index} out of range (0-${this._cellsCount - 1})`);
      return null;
    }
    return this._cellValues[index];
  }

  // 获取所有单元格的值
  getAllValues() {
    return [...this._cellValues];
  }
localSave(index,value){
    localStroage.setAttribute(key,value);
}
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .editable-row {
          display: grid;
          grid-template-columns: repeat(${this._cellsCount}, 1fr);
          gap: 0;
          font-family: sans-serif;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }
        textarea {
          resize: none;
          border: none;
          text-align: center;
          font-family: inherit;
          font-size: inherit;
          font-weight: bold;
          background: #fff;
          outline: none;

          overflow: hidden;
        }
        textarea:focus {
          background: #f9f9ff;
          box-shadow: inset 0 0 0 2px #0078d7;
          z-index: 1;
          position: relative;
        }
        textarea:not(:last-child) {
          border-right: 1px solid #eee;
        }
        .editable-row {
          width: 100%;
        }
      </style>
      <div class="editable-row" role="grid" aria-label="可编辑表格行">
        ${Array.from({ length: this._cellsCount }, (_, idx) => {
          const value = this._cellValues[idx] || '';
          const safeValue = String(value).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
          });
            const readonlyAttr = this.readOnly ? 'readonly' : '';
          return `<textarea rows="1" data-index="${idx}" aria-label="单元格 ${idx + 1}" placeholder=" " ${readonlyAttr}>${safeValue}</textarea>`;
        }).join('')}
      </div>
    `;

    // 自动调整每个textarea的高度，并同步内部数组
    const textareas = this.shadowRoot.querySelectorAll('textarea');
    textareas.forEach(ta => {
      const idx = parseInt(ta.getAttribute('data-index'), 10);
      
      const adjustHeight = () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      };
      
      // 输入时同步内部数组
      const handleInput = () => {
        this._cellValues[idx] = ta.value;
        adjustHeight();
      };
      
      ta.addEventListener('input', handleInput);
      
      // 初始调整
      adjustHeight();
      
      // Enter键移动到下一个单元格
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const next = ta.parentElement?.querySelector(`textarea[data-index="${idx + 1}"]`);
          if (next) next.focus();
        }
      });
    });
  }
}

customElements.define('calendar-excel', CalendarExcel);
