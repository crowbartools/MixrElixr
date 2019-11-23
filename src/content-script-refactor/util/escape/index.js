export function html(unsafe) {
    let div = document.createElement('div');
    div.innerText = unsafe;
    return div.innerHTML.replace(/"/g, '&quot;');
}

export function regex(unsafe) {
    return unsafe.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}