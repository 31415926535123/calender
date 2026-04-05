class CalendarHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.year = new Date().getFullYear();
    this.month = new Date().getMonth(); // 0-11
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        h2 {
          margin: 0;
          font-family: sans-serif;
          text-align: center;
        }
      </style>
      <h2>${this.year}年${this.month + 1}月</h2>
    `;
  }

  // 供外部调用来更新年月
  setDate(year, month) {
    this.year = year;
    this.month = month;
    this.render();
  }
}

customElements.define('calendar-header', CalendarHeader);
class CalendarWeekdays extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    this.shadowRoot.innerHTML = `
      <style>
        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: bold;
          font-family: sans-serif;
        }
        span {
          padding: 8px;
        }
      </style>
      <div class="weekdays">
        ${weekdays.map(day => `<span>${day}</span>`).join('')}
      </div>
    `;
  }
}

customElements.define('calendar-weekdays', CalendarWeekdays);