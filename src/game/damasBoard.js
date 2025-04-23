/**
 * damasBoard.js
 * Esta clase representa el tablero de Damas, con métodos para movimientos, capturas y verificación del estado del juego.
 */
class DamasBoard {
  constructor(size = 8) {
    // Define el tamaño del tablero, por defecto 8x8 casillas
    this.size = size;
    // Crea un tablero vacío como un array bidimensional lleno de valores null
    this.state = Array.from({ length: size }, () => Array(size).fill(null));
    // Coloca las fichas en sus posiciones iniciales
    this.initializeBoard();
    // El jugador rojo (humano) comienza la partida
    this.currentPlayer = 'red'; // 'red' es el humano, 'blue' es la computadora
    // Indica si el juego ha terminado (inicialmente falso)
    this.gameOver = false;
    // Almacena quién ganó cuando termina el juego (inicialmente nadie)
    this.winner = null;
  }

  // Inicializa el tablero con las fichas en sus posiciones iniciales
  initializeBoard() {
    // Recorre todas las filas del tablero
    for (let row = 0; row < this.size; row++) {
      // Recorre todas las columnas del tablero
      for (let col = 0; col < this.size; col++) {
        // En las damas, sólo se usan las casillas negras (cuando la suma de fila y columna es impar)
        if ((row + col) % 2 !== 0) {
          // Coloca las fichas azules en las primeras 3 filas
          if (row < 3) {
            this.state[row][col] = 'blue'; // Fichas de la computadora
          } 
          // Coloca las fichas rojas en las últimas 3 filas
          else if (row > 4) {
            this.state[row][col] = 'red'; // Fichas del jugador humano
          }
          // Las casillas del medio quedan vacías inicialmente
        }
      }
    }
  }

  // Imprime el tablero en la consola para depuración
  printFormattedBoard() {
    // Crea la fila superior con los números de columna
    let output = "  0 1 2 3 4 5 6 7\n";
    // Recorre todas las filas
    for (let row = 0; row < this.size; row++) {
      // Añade el número de fila al inicio de cada línea
      output += row + " ";
      // Recorre todas las columnas
      for (let col = 0; col < this.size; col++) {
        // Obtiene lo que hay en esta casilla
        const cell = this.state[row][col];
        // Si la casilla está vacía, muestra espacio o punto según el color de la casilla
        if (!cell) output += (row + col) % 2 === 0 ? "  " : ". ";
        // Si hay una ficha roja normal, muestra "r"
        else if (cell === 'red') output += "r ";
        // Si hay una ficha azul normal, muestra "b"
        else if (cell === 'blue') output += "b ";
        // Si hay una dama roja (ficha coronada), muestra "R"
        else if (cell === 'red_king') output += "R ";
        // Si hay una dama azul (ficha coronada), muestra "B"
        else if (cell === 'blue_king') output += "B ";
      }
      // Añade un salto de línea al final de cada fila
      output += "\n";
    }
    // Imprime el tablero completo en la consola
    console.log(output);
  }

  // Verifica si el juego ha terminado
  isTerminal() {
    // Cuenta el número total de fichas rojas (normales y damas)
    const redPieces = this.countPieces('red') + this.countPieces('red_king');
    // Cuenta el número total de fichas azules (normales y damas)
    const bluePieces = this.countPieces('blue') + this.countPieces('blue_king');
    
    // Si el jugador rojo se quedó sin fichas, gana el azul
    if (redPieces === 0) return { winner: 'blue' };
    // Si el jugador azul se quedó sin fichas, gana el rojo
    if (bluePieces === 0) return { winner: 'red' };
    
    // También se puede ganar si el oponente no tiene movimientos válidos
    const currentColor = this.currentPlayer;
    if (!this.hasValidMoves(currentColor)) {
      // Si el jugador actual no puede mover, gana el oponente
      return { winner: currentColor === 'red' ? 'blue' : 'red' };
    }
    
    // Si no se cumple ninguna condición anterior, el juego continúa
    return false;
  }

  // Cuenta las fichas de un color específico en el tablero
  countPieces(color) {
    let count = 0;
    // Recorre todo el tablero
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        // Incrementa el contador si encuentra una ficha del color buscado
        if (this.state[row][col] === color) count++;
      }
    }
    // Devuelve el total de fichas encontradas
    return count;
  }

  // Verifica si un jugador tiene movimientos válidos disponibles
  hasValidMoves(color) {
    // Recorre todo el tablero
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const piece = this.state[row][col];
        // Si encuentra una ficha del color actual (normal o dama)
        if ((piece === color || piece === `${color}_king`) && 
            // Y esa ficha tiene al menos un movimiento válido
            this.getValidMoves(row, col).length > 0) {
          return true; // El jugador puede mover
        }
      }
    }
    // Si no encontró ningún movimiento válido
    return false;
  }

  // Obtiene todos los movimientos válidos para una ficha en una posición específica
  getValidMoves(row, col) {
    // Obtiene qué hay en la posición indicada
    const piece = this.state[row][col];
    // Si no hay ficha, no hay movimientos posibles
    if (!piece) return [];

    // Lista para almacenar los movimientos válidos
    const moves = [];
    // Verifica si la ficha es una dama (rey)
    const isKing = piece.includes('_king');
    // Obtiene el color de la ficha (rojo o azul)
    const color = piece.split('_')[0];
    // Determina el color del oponente
    const opponent = color === 'red' ? 'blue' : 'red';

    // Define las direcciones en las que puede moverse según su tipo
    const directions = [];
    // Las fichas rojas y las damas pueden moverse hacia arriba (filas menores)
    if (color === 'red' || isKing) directions.push([-1, -1], [-1, 1]); // Arriba
    // Las fichas azules y las damas pueden moverse hacia abajo (filas mayores)
    if (color === 'blue' || isKing) directions.push([1, -1], [1, 1]);   // Abajo

    // Verifica cada dirección posible
    for (const [dr, dc] of directions) {
      // Calcula la nueva posición en esta dirección
      const newRow = row + dr;
      const newCol = col + dc;
      
      // Verifica si la nueva posición está dentro del tablero
      if (this.isValidPosition(newRow, newCol)) {
        // Si la casilla está vacía, es un movimiento simple
        if (!this.state[newRow][newCol]) {
          // Añade este movimiento a la lista de movimientos válidos
          moves.push({
            type: 'move', // Tipo de movimiento: simple
            from: { row, col }, // Posición de origen
            to: { row: newRow, col: newCol }, // Posición de destino
            captured: null // No se captura ninguna ficha
          });
        } 
        // Si hay una ficha del oponente, podría ser una captura
        else if (this.state[newRow][newCol].includes(opponent)) {
          // Calcula la posición donde aterrizaría después de saltar
          const jumpRow = newRow + dr;
          const jumpCol = newCol + dc;
          
          // Verifica si puede aterrizar (posición válida y vacía)
          if (this.isValidPosition(jumpRow, jumpCol) && !this.state[jumpRow][jumpCol]) {
            // Añade este movimiento de captura a la lista
            moves.push({
              type: 'capture', // Tipo de movimiento: captura
              from: { row, col }, // Posición de origen
              to: { row: jumpRow, col: jumpCol }, // Posición de destino
              captured: { row: newRow, col: newCol } // Posición de la ficha capturada
            });
          }
        }
      }
    }

    // Devuelve todos los movimientos válidos encontrados
    return moves;
  }

  // Verifica si una posición está dentro de los límites del tablero
  isValidPosition(row, col) {
    // Una posición es válida si tanto la fila como la columna están entre 0 y el tamaño del tablero
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  // Realiza un movimiento en el tablero
  makeMove(move) {
    // Extrae la información del movimiento
    const { from, to, captured } = move;
    // Obtiene la ficha que se va a mover
    const piece = this.state[from.row][from.col];
    
    // Registra el movimiento en la consola (para depuración)
    console.log(`Movimiento realizado por ${this.currentPlayer}: de (${from.row}, ${from.col}) a (${to.row}, ${to.col})`);
    if (captured) {
      console.log(`Ficha capturada en (${captured.row}, ${captured.col})`);
    }
    
    // Mueve la ficha a su nueva posición
    this.state[to.row][to.col] = piece;
    // Elimina la ficha de su posición original
    this.state[from.row][from.col] = '';
    
    // Si hubo captura, elimina la ficha capturada
    if (captured) {
      this.state[captured.row][captured.col] = '';
    }
    
    // Verifica si la ficha debe coronarse (convertirse en dama/rey)
    // Rojo corona en la fila 0, azul corona en la última fila
    if ((piece === 'red' && to.row === 0) || (piece === 'blue' && to.row === this.size - 1)) {
      this.state[to.row][to.col] = `${piece}_king`;
    }
    
    // Verifica si hay capturas adicionales posibles (capturas múltiples)
    const additionalCaptures = this.getValidMoves(to.row, to.col).filter(m => m.type === 'capture');
    if (additionalCaptures.length === 0) {
      // Cambia el turno solo si no hay más capturas posibles para esta ficha
      this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
    }
    
    // Verifica si el juego ha terminado después de este movimiento
    const terminal = this.isTerminal();
    if (terminal) {
      this.gameOver = true;
      this.winner = terminal.winner;
    }
    
    // Indica que el movimiento se realizó correctamente
    return true;
  }

  // Crea una copia del tablero (útil para simular movimientos sin afectar el juego real)
  clone() {
    // Crea un nuevo tablero del mismo tamaño
    const newBoard = new DamasBoard(this.size);
    // Copia el estado actual del tablero (todas las fichas)
    newBoard.state = this.state.map(row => [...row]);
    // Copia el jugador actual
    newBoard.currentPlayer = this.currentPlayer;
    // Copia si el juego ha terminado
    newBoard.gameOver = this.gameOver;
    // Copia quién es el ganador (si hay)
    newBoard.winner = this.winner;
    // Devuelve la copia del tablero
    return newBoard;
  }
}

// Exporta la clase para que pueda ser usada en otros archivos
export default DamasBoard;