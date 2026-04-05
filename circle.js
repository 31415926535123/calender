export class Circle {
       
        
  constructor(year, month) {
        this.year = year;
    this.month = month;
    const key = this.getStorageKey();
    console.log(key)
    const savedData = localStorage.getItem(key);
    this.circledDates = savedData ? JSON.parse(savedData) : {};
    console.log(savedData)
    window.addEventListener('beforeunload',()=>{
      const key = this.getStorageKey();
      if(this.circledDates){
    localStorage.setItem(key,JSON.stringify(this.circledDates))};
    })
  }
draw(circleColor, name,uniId,root) {
  const i=name;
   const existingStyle = root.getElementById(uniId);
  // 避免重复添加
  if (existingStyle) {
    const previousColor = existingStyle.getAttribute('data-color');
    console.log(previousColor);
    existingStyle.remove();
if(previousColor === circleColor) {
        return null;
}
}
  const style = document.createElement('style');
  style.id = uniId;
  style.setAttribute('data-color', circleColor);
  style.textContent = `
    ${i} {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1.8em;
      height: 1.8em;
      border-radius: 50%;
      border: 2px solid ${circleColor};
      pointer-events: none;
      z-index: 1;
    }
  `;
  
  return style;


}
  getStorageKey() {
    return `calendar_circles_${this.year}_${this.month}`;
  }

  // 保存某个日期的圆圈颜色
  saveCircledDate=(date, color)=> {
    const key=this.getStorageKey();
    // 存储格式改为对象：{ "5": "#ff4444", "12": "#4488ff" }
    this.circledDates[date] = color;
    console.log(date,color);
    localStorage.setItem(key, JSON.stringify(this.circledDates));
    console.log(JSON.stringify(this.circledDates));
  }
  
  // 移除某个日期的圆圈
  removeCircledDate=(date)=> {
    delete this.circledDates[date];
    console.log(this.circledDates)
  }
  
  // 获取某个日期的圆圈颜色，如果没有圆圈则返回 null
  getDateCircleColor(date){
    //console.log(this);
      return this.circledDates[date] || null;
  }
  
  // 判断某个日期是否有圆圈
  isDateCircled(date) {
    return this.getDateCircleColor(date) !== null;
  }
  updateDateColor(date, color) {
    this.circledDates[date] = color;
  }
}