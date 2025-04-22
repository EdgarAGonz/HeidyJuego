/**
 * damasBoard.js
 * Esta clase representa el tablero de Damas, con métodos para movimientos, capturas y verificación del estado del juego.
 */
class DamasBoard {
  constructor(size = 8) {
    this.size = size;
    this.state = Array.from({ length: size }, () => Array(size).fill(null));
    this.initializeBoard();
    this.currentPlayer = 'red'; // 'red' es el humano, 'blue' es la computadora
    this.gameOver = false;
    this.winner = null;
  }

  // Inicializa el tablero con las fichas en sus posiciones iniciales
  initializeBoard() {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if ((row + col) % 2 !== 0) {
          if (row < 3) {
            this.state[row][col] = 'blue'; // Fichas de la computadora
          } else if (row > 4) {
            this.state[row][col] = 'red'; // Fichas del jugador humano
          }
        }
      }
    }
  }

  // Imprime el tablero en la consola
  printFormattedBoard() {
    let output = "  0 1 2 3 4 5 6 7\n";
    for (let row = 0; row < this.size; row++) {
      output += row + " ";
      for (let col = 0; col < this.size; col++) {
        const cell = this.state[row][col];
        if (!cell) output += (row + col) % 2 === 0 ? "  " : ". ";
        else if (cell === 'red') output += "r ";
        else if (cell === 'blue') output += "b ";
        else if (cell === 'red_king') output += "R ";
        else if (cell === 'blue_king') output += "B ";
      }
      output += "\n";
    }
    console.log(output);
  }

  // Verifica si el juego ha terminado
  isTerminal() {
    const redPieces = this.countPieces('red') + this.countPieces('red_king');
    const bluePieces = this.countPieces('blue') + this.countPieces('blue_king');
    
    if (redPieces === 0) return { winner: 'blue' };
    if (bluePieces === 0) return { winner: 'red' };
    
    // Verificar si el jugador actual no tiene movimientos válidos
    const currentColor = this.currentPlayer;
    if (!this.hasValidMoves(currentColor)) {
      return { winner: currentColor === 'red' ? 'blue' : 'red' };
    }
    
    return false;
  }

  // Cuenta las fichas de un color específico
  countPieces(color) {
    let count = 0;
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.state[row][col] === color) count++;
      }
    }
    return count;
  }

  // Verifica si un jugador tiene movimientos válidos
  hasValidMoves(color) {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const piece = this.state[row][col];
        if ((piece === color || piece === `${color}_king`) && 
            this.getValidMoves(row, col).length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  // Obtiene todos los movimientos válidos para una ficha
  getValidMoves(row, col) {
    const piece = this.state[row][col];
    if (!piece) return [];

    const moves = [];
    const isKing = piece.includes('_king');
    const color = piece.split('_')[0];
    const opponent = color === 'red' ? 'blue' : 'red';

    // Direcciones de movimiento según el tipo de ficha
    const directions = [];
    if (color === 'red' || isKing) directions.push([-1, -1], [-1, 1]); // Arriba
    if (color === 'blue' || isKing) directions.push([1, -1], [1, 1]);   // Abajo

    // Verificar movimientos simples y capturas
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (this.isValidPosition(newRow, newCol)) {
        if (!this.state[newRow][newCol]) {
          // Movimiento simple
          moves.push({
            type: 'move',
            from: { row, col },
            to: { row: newRow, col: newCol },
            captured: null
          });
        } else if (this.state[newRow][newCol].includes(opponent)) {
          // Posible captura
          const jumpRow = newRow + dr;
          const jumpCol = newCol + dc;
          
          if (this.isValidPosition(jumpRow, jumpCol) && !this.state[jumpRow][jumpCol]) {
            moves.push({
              type: 'capture',
              from: { row, col },
              to: { row: jumpRow, col: jumpCol },
              captured: { row: newRow, col: newCol }
            });
          }
        }
      }
    }

    return moves;
  }

  // Verifica si una posición está dentro del tablero
  isValidPosition(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  // Realiza un movimiento en el tablero
  makeMove(move) {
  const { from, to, captured } = move;
  const piece = this.state[from.row][from.col];
  
  console.log(`Movimiento realizado por ${this.currentPlayer}: de (${from.row}, ${from.col}) a (${to.row}, ${to.col})`);
  if (captured) {
    console.log(`Ficha capturada en (${captured.row}, ${captured.col})`);
  }
  
  // Mover la ficha
  this.state[to.row][to.col] = piece;
  this.state[from.row][from.col] = '';
  
  // Eliminar ficha capturada si hay
  if (captured) {
    this.state[captured.row][captured.col] = '';
  }
  
  // Coronar si llega al extremo opuesto
  if ((piece === 'red' && to.row === 0) || (piece === 'blue' && to.row === this.size - 1)) {
    this.state[to.row][to.col] = `${piece}_king`;
  }
  
  // Verificar si hay capturas adicionales
  const additionalCaptures = this.getValidMoves(to.row, to.col).filter(m => m.type === 'capture');
  if (additionalCaptures.length === 0) {
    // Cambiar turno solo si no hay capturas adicionales
    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
  }
  
  // Verificar si el juego ha terminado
  const terminal = this.isTerminal();
  if (terminal) {
    this.gameOver = true;
    this.winner = terminal.winner;
  }
  
  return true;
}

  // Clona el tablero para simulaciones
  clone() {
    const newBoard = new DamasBoard(this.size);
    newBoard.state = this.state.map(row => [...row]);
    newBoard.currentPlayer = this.currentPlayer;
    newBoard.gameOver = this.gameOver;
    newBoard.winner = this.winner;
    return newBoard;
  }
}

export default DamasBoard;