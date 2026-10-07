// Native Android Back delegates to this route stack; forms stay in the WebView.
let appRoutes=[],restoringRoute=false,entrySnapshot='',rangeEndEdited=false;
const entryPages=['entry','accountEntry','transferEntry','leaveEntry'];
function formSnapshot(){const section=$(page);return section?JSON.stringify([...section.querySelectorAll('input,select')].map(n=>[n.id,n.value,n.checked])):''}
function initNavigationAndLeave(){
  const originalShow=show;
  show=function(next){
    if(next!==page&&!restoringRoute){
      if(next==='home')appRoutes=[];
      else if(entryPages.includes(page)){
        // Saving or cancelling a form never puts that form on the Back stack.
        if(appRoutes.at(-1)===next)appRoutes.pop();
      }else{appRoutes.push(page);if(appRoutes.length>30)appRoutes.shift()}
    }
    originalShow(next);entrySnapshot=formSnapshot();
  };
  window.handleAppBack=function(){
    const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length){dialogs.at(-1).close();return true}
    if(entryPages.includes(page)&&formSnapshot()!==entrySnapshot&&!confirm('Discard these unsaved changes?'))return true;
    if(page==='home')return false;
    const parent={entry:entryReturn,accountEntry:'accounts',transferEntry:'accounts',leaveEntry:'calendar',accounts:'more',insights:'more'};
    let previous=appRoutes.pop()||parent[page]||'home';
    if(entryPages.includes(previous))previous=parent[previous]||'home';
    restoringRoute=true;show(previous);restoringRoute=false;return true;
  };
  $('leaveDate').previousElementSibling.textContent='From';
  const extra=node('div');extra.innerHTML='<label for="leaveEnd">To</label><input id="leaveEnd" type="date" required><div id="weekendOptions"><label for="leaveWeekends">Days to include</label><select id="leaveWeekends"><option value="include">Every date, including weekends</option><option value="skip">Skip Saturday and Sunday</option></select></div><p id="leaveRangePreview" class="notice" aria-live="polite"></p>';
  $('leaveDate').after(extra);$('leaveDays').previousElementSibling.textContent='Duration per day';
  $('leaveForm').querySelector('p.notice:not(#leaveRangePreview)').textContent='Each selected date is saved separately, so you can later edit or cancel an individual day.';
  const originalOpenLeave=openLeave;
  openLeave=function(id=null,date=today()){
    originalOpenLeave(id,date);rangeEndEdited=false;$('leaveEnd').value=$('leaveDate').value;$('leaveEnd').disabled=!!id;$('leaveWeekends').value='include';$('weekendOptions').classList.toggle('hidden',!!id);previewLeaveRange();entrySnapshot=formSnapshot();
  };
  $('leaveDate').oninput=()=>{if(!rangeEndEdited||$('leaveEnd').value<$('leaveDate').value||editingLeave)$('leaveEnd').value=$('leaveDate').value;previewLeaveRange()};
  $('leaveEnd').oninput=()=>{rangeEndEdited=true;previewLeaveRange()};
  $('leaveWeekends').onchange=previewLeaveRange;$('leaveDays').onchange=previewLeaveRange;
  $('leaveForm').onsubmit=saveLeaveRange;
}
function leaveDates(from,to,skipWeekends){
  if(!validDate(from)||!validDate(to)||from>to)throw Error('Choose a valid From and To date.');
  const dates=[],start=new Date(from+'T12:00:00Z'),end=new Date(to+'T12:00:00Z');
  if((end-start)/86400000>=366)throw Error('Choose a range of up to 366 dates.');
  for(let d=start;d<=end;d.setUTCDate(d.getUTCDate()+1))if(!skipWeekends||![0,6].includes(d.getUTCDay()))dates.push(d.toISOString().slice(0,10));
  if(!dates.length)throw Error('No days selected. Include weekends or choose other dates.');return dates;
}
function previewLeaveRange(){
  try{const dates=leaveDates($('leaveDate').value,$('leaveEnd').value,$('leaveWeekends').value==='skip'),days=Number($('leaveDays').value);$('leaveRangePreview').textContent=dates.length+' date'+(dates.length===1?'':'s')+' · '+dates.length*days+' leave day'+(dates.length*days===1?'':'s')+(editingLeave?' · Editing this date only':'')}catch(e){$('leaveRangePreview').textContent=e.message}
}
function saveLeaveRange(e){
  e.preventDefault();let dates;try{dates=leaveDates($('leaveDate').value,editingLeave?$('leaveDate').value:$('leaveEnd').value,!editingLeave&&$('leaveWeekends').value==='skip')}catch(err){message(err.message);return}
  const days=Number($('leaveDays').value),status=$('leaveStatus').value,reason=$('leaveReason').value.trim();
  if(status==='taken'&&dates.some(d=>d>today())){message('For future dates choose Planned. Mark them Taken after the leave.');return}
  const newLeaves=dates.map(date=>({id:editingLeave||uid(),date,days,status,reason})),leaves=state.leaves.filter(x=>x.id!==editingLeave).concat(newLeaves);
  try{validateLeaves(leaves)}catch{message('Check the details. Total leave on one date cannot exceed 1 day. No dates were saved.');return}
  if(update({leaves})){
    const from=dates[0],to=dates.at(-1);leaveMonth=from.slice(0,7);
    if(leaveMode==='custom'&&(!inRange(from,leaveRange())||!inRange(to,leaveRange()))){$('leaveFrom').value=from;$('leaveTo').value=to}
    else leaveYear=leaveMode==='fy'&&Number(from.slice(5,7))<4?Number(from.slice(0,4))-1:Number(from.slice(0,4));
    show('calendar');message(dates.length===1?'Leave saved':dates.length+' leave dates saved');
  }
}
