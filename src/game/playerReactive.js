export default class ReactivePlayer {
  constructor() {
    // Inicializa las reglas de comportamiento del jugador automático
    this.rules = {
      // Prioridad 1: Busca y ejecuta capturas disponibles (comer fichas del oponente)
      capture: (board, color) => {
        const captures = []; // Almacena los movimientos de captura encontrados
        // Recorre todo el tablero buscando piezas del color del jugador
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) { // Si hay una pieza de nuestro color
              // Obtiene todos los movimientos posibles para esa pieza
              const moves = board.getValidMoves(row, col);
              // Filtra solo los movimientos que son capturas
              moves.forEach(move => {
                if (move.type === 'capture') captures.push(move);
              });
            }
          }
        }
        return captures; // Devuelve la lista de capturas posibles
      },
      
      // Prioridad 2: Intenta coronar fichas (llegar al extremo opuesto del tablero)
      promote: (board, color) => {
        const promotions = []; // Almacena movimientos que coronan piezas
        // Define la fila objetivo según el color (fila 0 para rojo, última fila para azul)
        const lastRow = color === 'red' ? 0 : board.size - 1;
        
        // Recorre todo el tablero
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece === color) { // Solo considera fichas no coronadas
              const moves = board.getValidMoves(row, col);
              // Busca movimientos que lleguen a la fila de coronación
              moves.forEach(move => {
                if (move.to.row === lastRow) promotions.push(move);
              });
            }
          }
        }
        return promotions; // Devuelve los movimientos de coronación
      },
      
      // Prioridad 3: Movimientos defensivos (evita que las fichas queden expuestas)
      defensive: (board, color) => {
        const defensiveMoves = []; // Almacena movimientos seguros
        // Recorre todo el tablero
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) { // Si hay una pieza nuestra
              const moves = board.getValidMoves(row, col);
              // Añade solo movimientos donde la ficha no quedará en peligro
              defensiveMoves.push(...moves.filter(move => {
                // Verifica si la posición destino es segura
                return !this.isPositionUnderThreat(board, move.to.row, move.to.col, color);
              }));
            }
          }
        }
        return defensiveMoves; // Devuelve movimientos defensivos
      },
      
      // Prioridad 4: Movimientos ofensivos (avanza hacia el lado del oponente)
      offensive: (board, color) => {
        const offensiveMoves = []; // Almacena movimientos de avance
        // Recorre todo el tablero
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) { // Si hay una pieza nuestra
              const moves = board.getValidMoves(row, col);
              // Selecciona movimientos que avanzan en la dirección correcta
              moves.forEach(move => {
                // El rojo avanza hacia arriba (filas menores) y el azul hacia abajo (filas mayores)
                if ((color === 'red' && move.to.row < row) || 
                    (color === 'blue' && move.to.row > row)) {
                  offensiveMoves.push(move);
                }
              });
            }
          }
        }
        return offensiveMoves; // Devuelve movimientos de avance
      },
      
      // Prioridad 5: Movimientos aleatorios (última opción si no hay mejores)
      random: (board, color) => {
        const allMoves = []; // Almacena cualquier movimiento válido
        // Recorre todo el tablero
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) { // Si hay una pieza nuestra
              // Añade todos los movimientos posibles sin filtrar
              const moves = board.getValidMoves(row, col);
              allMoves.push(...moves);
            }
          }
        }
        return allMoves; // Devuelve todos los movimientos posibles
      }
    };
  }

  // Determina si una posición está amenazada por el oponente (podría ser capturada)
  isPositionUnderThreat(board, row, col, color) {
    const opponent = color === 'red' ? 'blue' : 'red'; // Identifica el color del oponente
    const directions = [[-1,-1],[-1,1],[1,-1],[1,1]]; // Las cuatro direcciones diagonales
    
    // Comprueba cada dirección diagonal
    for (const [dr, dc] of directions) {
      // Calcula la posición adyacente en esta dirección
      const adjRow = row + dr;
      const adjCol = col + dc;
      // Calcula la posición donde saltaría el oponente al capturar
      const jumpRow = row - dr;
      const jumpCol = col - dc;
      
      // Verifica si existe una amenaza de captura:
      // 1. La posición adyacente está dentro del tablero
      // 2. Hay una pieza del oponente en esa posición
      // 3. La posición detrás está dentro del tablero
      // 4. La posición detrás está vacía (para que pueda saltar)
      if (board.isValidPosition(adjRow, adjCol) && 
          board.state[adjRow][adjCol] && 
          board.state[adjRow][adjCol].includes(opponent) &&
          board.isValidPosition(jumpRow, jumpCol) && 
          !board.state[jumpRow][jumpCol]) {
        return true; // Esta posición está amenazada
      }
    }
    return false; // No se encontró amenaza
  }

  // Elige el mejor movimiento según las reglas de prioridad
  getBestMove(board, color) {
    // Aplica las reglas en orden de prioridad:
    
    // 1. Intenta capturar fichas del oponente
    let moves = this.rules.capture(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    // 2. Si no hay capturas, intenta coronar fichas
    moves = this.rules.promote(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    // 3. Si no hay promociones, realiza movimientos defensivos
    moves = this.rules.defensive(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    // 4. Si no hay movimientos defensivos, avanza ofensivamente
    moves = this.rules.offensive(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    // 5. Si no hay mejores opciones, realiza un movimiento aleatorio
    moves = this.rules.random(board, color);
    return this.selectRandomMove(moves);
  }

  // Elige un movimiento aleatorio de la lista de movimientos disponibles
  selectRandomMove(moves) {
    // Si hay movimientos disponibles, selecciona uno al azar, sino devuelve null
    return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
  }
}