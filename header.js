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

