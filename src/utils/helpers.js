// Helpers (from http://jaketrent.com/post/addremove-classes-raw-javascript/)
export function hasClass(el, className) {
    if (el.classList) return el.classList.contains(className);
    else return !!el.className.match(new RegExp("(\\s|^)" + className + "(\\s|$)"));
}

export function addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!hasClass(el, className)) el.className += " " + className;
}

export function removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else if (hasClass(el, className)) {
        var reg = new RegExp("(\\s|^)" + className + "(\\s|$)");
        el.className = el.className.replace(reg, " ");
    }
}

/**
 * Dibuja una línea ganadora en el tablero de Conecta 4.
 * @param {Object} statusObject - Objeto que contiene información sobre el estado ganador.
 */
export function drawWinningLine(statusObject) {
    if (!statusObject) return;
    const { winner, direction, row, column, diagonal } = statusObject;

    if (winner === "draw") return; // No dibujar nada si es un empate

    const board = document.getElementById("board");

    // Agregar una clase específica según la dirección de la victoria
    if (direction === "H") {
        addClass(board, `horizontal-row-${row}`);
    } else if (direction === "V") {
        addClass(board, `vertical-column-${column}`);
    } else if (direction === "D" && diagonal === "main") {
        addClass(board, "diagonal-main");
    } else if (direction === "D" && diagonal === "counter") {
        addClass(board, "diagonal-counter");
    }

    // Agregar una clase para animar la línea ganadora
    setTimeout(() => {
        addClass(board, "fullLine");
    }, 50);
}
