import {Circle}from "./circle.js"
class CalendarDates extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.count=0;
    this.saveTimer = null;
    this.year = new Date().getFullYear();
    this.month = new Date().getMonth();
    this.circle=new Circle(this.year,this.month);
    this.render();
  }

  getStorageKey() {
    return `calendar_notes_${this.year}_${this.month}`;
  }

  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  getFirstDayIndex(year, month) {
    return new Date(year, month, 1).getDay();
  }

  saveNoteContent(date, content) {
    const key = this.getStorageKey();
    const savedData = localStorage.getItem(key);
    const notes = savedData ? JSON.parse(savedData) : {};
    
    if (content.trim() === '') {
      delete notes[date];
    } else {
      notes[date] = content;
    }
    
    localStorage.setItem(key, JSON.stringify(notes));
  }




  loadNoteContent(date) {
    const key = this.getStorageKey();
    const savedData = localStorage.getItem(key);
    if (savedData) {
      const notes = JSON.parse(savedData);
      return notes[date] || '';
    }
    return '';
  }

  render() {
    const daysInMonth = this.getDaysInMonth(this.year, this.month);
    const firstDayIndex = this.getFirstDayIndex(this.year, this.month);
    
    const totalDays = daysInMonth + firstDayIndex;
    const rowsNeeded = Math.ceil(totalDays / 7);
    const totalCells = rowsNeeded * 7;
    
    let cells = [];
    
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ type: 'empty', date: null });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ type: 'date', date: i });
    }
    
    while (cells.length < totalCells) {
      cells.push({ type: 'empty', date: null });
    }
if (!this.count){
    this.shadowRoot.innerHTML = `
    <style>        .dates-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          font-family: sans-serif;
          margin: 0 auto;
        }
        
        .date-cell {
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          display: flex;
          flex-direction: column;
          min-height: 120px;
          overflow: hidden;
          transition: all 0.2s;
        }
        
        .date-cell:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .date-cell.empty {
          background: transparent;
          border: 1px solid transparent;
          box-shadow: none;
          pointer-events: none;
        }
        
        .date-number {
          padding: 8px;
          font-weight: bold;
          background: #f0f0f0;
          border-bottom: 1px solid #ddd;
          font-size: 14px;
          text-align: center;
          position: relative;
          display: inline-block;
          width: 100%;
          box-sizing: border-box;
        }
        

        
        .date-cell.today .date-number {
          background: #007bff;
          color: white;
        }
        
        textarea {
          width: 100%;
          min-height: 80px;
          padding: 8px;
          border: none;
          resize: vertical;
          font-family: inherit;
          font-size: 12px;
          line-height: 1.4;
          box-sizing: border-box;
          background: transparent;
          cursor: text;
        }
        
        textarea:focus {
          outline: none;
          background: #fff9e0;
        }
        
        textarea::placeholder {
          color: #ccc;
        }</style>
      <div class="dates-grid">
      
        ${cells.map(cell => {
          if (cell.type === 'empty') {
            return `<div class="date-cell empty"></div>`;
          }
          
          const isToday = this.year === new Date().getFullYear() &&
            this.month === new Date().getMonth() &&
            cell.date === new Date().getDate();
          
          const savedContent = this.loadNoteContent(cell.date);
          const todayClass = isToday ? 'today' : '';

          
          return `
            <div class="date-cell ${todayClass}" data-date="${cell.date}">
              <div class="date-number">
                ${cell.date}
              </div>
              <textarea 
                data-date="${cell.date}"
                placeholder=""
                style="resize:none;"
              >${this.escapeHtml(savedContent)}</textarea>
            </div>
          `;}
        ).join('')
        }</div>
    `;}
    else{this.shadowRoot.innerHTML=this.shadowRoot.innerHTML;}
    this.bindEvents();
  }
  bindEvents() {
    // 绑定 textarea 事件
    const textareas = this.shadowRoot.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      const date = parseInt(textarea.getAttribute('data-date'));
      if (date && !isNaN(date)) {
        textarea.addEventListener('blur', () => {
          this.saveNoteContent(date, textarea.value);
        });
        
        textarea.addEventListener('input', () => {
          this.saveNoteContent(date, textarea.value);
        });
      }
    });
    const colorPicker=document.querySelector('color-picker-menu');
    const Divs=this.shadowRoot.querySelectorAll('.date-number');
    
    Divs.forEach((i,j)=>{
            const c=`div-${j}`
      i.id=c;
const d='#'+c+'::after';
      const orgColor=this.circle.getDateCircleColor(j);
      console.log(orgColor)
      if(orgColor){
        
        this.shadowRoot.appendChild(this.circle.draw(orgColor,d,'unique-'+c,this.shadowRoot));
      }

      i.addEventListener('click',()=>{
        const co=colorPicker.getSelectedColor();
        const result=this.circle.draw(co,d,'unique-'+c,this.shadowRoot);
        console.log(result);
        if(result){
        this.shadowRoot.appendChild(result);
        console.log(j);
      this.circle.saveCircledDate(j,co);
      }
      else{this.circle.removeCircledDate(j);console.log(j);}
      });
    })
  }
  

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setDate(year, month) {
    this.year = year;
    this.month = month;
    this.circle=new Circle(year,month);
    this.render();
  }
}


customElements.define('calendar-dates', CalendarDates);