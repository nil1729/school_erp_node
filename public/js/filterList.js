const filterList = e => {
    const data = document.querySelectorAll('.show .s_filter');
    const text = e.target.value;
    if(text === ''){
        data.forEach(item => {
            item.style.color = '';
            item.style.fontWeight = 'normal';
        });
    }else{
        data.forEach(item => {
        const lwCase = item.textContent.toLowerCase();
        if(lwCase.indexOf(text) > -1){
            item.style.color = 'red';
            item.style.fontWeight = '600';
        }else{
            item.style.color = '';
            item.style.fontWeight = 'normal';
        }
        });
    }
};
const search = document.querySelector('.search');
search.addEventListener('keyup', filterList)

// Filter Table according to Classes
const rows = document.querySelectorAll('.table-row');
window.onload = () => {
    if(typeof rows !== 'undefined'){
            rows.forEach(function (row) {
        if(row.classList[0] !== '12-A'){
                row.style.display = 'none';
                row.classList.remove('show');
            }
        });
    }
};
function changeClass (e) {
    rows.forEach(function (row) {
        row.style.display = '';
        row.classList.add('show');
       if(row.classList[0] !== e){
           row.style.display = 'none';
           row.classList.remove('show');
       }
    });
};