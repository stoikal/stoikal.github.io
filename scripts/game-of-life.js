
// Conway's Game of Life rules:
// 1. Any live cell with two or three live neighbours survives.
// 2. Any dead cell with three live neighbours becomes a live cell.
// 3. All other live cells die in the next generation. Similarly, all other dead cells stay dead.

class GameOfLife extends HTMLElement {
  #frame = 0;

  #config = {
    CELL_SIZE: 16,
    INITIAL_DENSITY: 0.2,
    MAX_FPS: 24,
    ENABLE_ZOOM: true,
    ENABLE_PAN: true,
    INITIAL_PATTERN: [
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "o.o.............................................o.o",
      "..o.............................................o..",
      "....o.........................................o....",
      "....o.o.....................................o.o....",
      "....o.oo...................................oo.o....",
      "......o.....................................o......",
    ],
    COLORS_BY_AGE: [
      "#e65f5c", // age 1
      "#bd4e52",
      "#7d3242",
      "#451a34",
      "#0F0326",
    ],
    TRAIL_COLORS_BY_AGE: [
      "#9f9aa8",
      "#9f9aa8",
      "#9f9aa8",
      "#9f9aa8",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
    ]
  }

  #canvas = {
    canvas: null,
    ctx: null,
    width: null,
    height: null,
  }

  #arena = {
    offsetX: null,
    offsetY: null,
    xCellCount: null,
    yCellCount: null,
  }

  #state = null;

  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }

        .container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .panel {
          display: none;
          position: absolute;
          bottom: 10px;
          right: 10px
        }

        canvas {
          box-sizing: border-box;
          background: #e8f5e9;
        }

        canvas.grab {
          cursor: grab;
        }

        canvas.grabbing {
          cursor: grabbing;
        }
        
        button {
          min-width: 44px;
          min-height: 44px;
          user-select: none;
        }

      </style>
      <div class="container">
        <canvas>
          Your browser does not support HTML5 canvas.
        </canvas>

      </div>
    `;
  }

  connectedCallback () {
    this.#canvas = this.#getCanvas();
    this.#arena = this.#getArena(this.#canvas);
    this.#state = this.#getPattern();

    this.#startAnimation();

    if (this.#config.ENABLE_ZOOM) {
      this.#enableZoom();
    }

    if (this.#config.ENABLE_PAN) {
      this.#enablePan();
    }

    window.addEventListener('resize', () => {
      this.#canvas = this.#getCanvas()
    });
  }

  #enableZoom () {
    const { canvas } = this.#canvas;

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
  
      if (event.deltaY < 0) {
        this.#config.CELL_SIZE++
        this.#arena.offsetX -= (event.clientX / 10);
        this.#arena.offsetY -= (event.clientY / 10);
      } else if (event.deltaY > 0) {
        if (this.#config.CELL_SIZE > 1) {
          this.#config.CELL_SIZE--
          this.#arena.offsetX += (event.clientX / 10);
          this.#arena.offsetY += (event.clientY / 10);
        }
      }
    });
  }

  #enablePan () {
    const { canvas } = this.#canvas;

    canvas.classList.add("grab");

    canvas.addEventListener("mousedown", () => {
      canvas.classList.add("grabbing");
    })

    canvas.addEventListener("mouseup", () => {
      canvas.classList.remove("grabbing");
    })

    canvas.addEventListener("mouseout", () => {
      canvas.classList.remove("grabbing");
    })

    let prevX = 0;
    let prevY = 0;

    canvas.addEventListener("mousemove", (event) => {
      const { top, left } = canvas.getBoundingClientRect();
      const currentX = event.clientX - left;
      const currentY = event.clientY - top;

      if (canvas.classList.contains("grabbing")) {
        const diffX = currentX - prevX;
        const diffY = currentY - prevY;
    
        let offsetX = this.#arena.offsetX + diffX;
        let offsetY = this.#arena.offsetY + diffY;

        this.#arena.offsetX = offsetX;
        this.#arena.offsetY = offsetY;
      }

      prevX = currentX;
      prevY = currentY;
    })
  }

  #startAnimation () {
    this.#animate();
  }

  #animate () {
    const { MAX_FPS } = this.#config;

    const interval = 1000 / MAX_FPS;
    let lastTimestamp = 0;

    const throttledAnimationFrame = (timestamp) => {
      if (!lastTimestamp || timestamp - lastTimestamp >= interval) {
        this.#frame++
        this.#state = this.#calculateState(this.#state);
        lastTimestamp = timestamp;
      }
      
      this.#draw(this.#state);
      requestAnimationFrame(throttledAnimationFrame);
    }

    requestAnimationFrame(throttledAnimationFrame);
  }

  #calculateState = (prevState) => {
    const { TRAIL_COLORS_BY_AGE } = this.#config;

    const state = {};
    const checked = {};
  
    Object.entries(prevState).forEach(([key, age]) => {
      
      if (age > 0) {
        const coord = this.#stringToCoordinate(key);
        const neighboringCoords = this.#getNeighboringCoordinates(coord);
        const neighborCount = this.#getLiveCellsCount(neighboringCoords, prevState);
        const livesOn = neighborCount === 2 || neighborCount === 3;

        if (livesOn) {
          state[key] = age + 1;
        } else {
          state[key] = 0; // dies
        }

        checked[key] = true;

        for (const coord of neighboringCoords) {
          const neighborKey = String(coord);
          const isChecked = checked[neighborKey];
  
          checked[neighborKey] = true;
  
          if (isChecked) continue;
          const neighborNeighboringCoords = this.#getNeighboringCoordinates(coord)
          const count = this.#getLiveCellsCount(neighborNeighboringCoords, prevState)
  
  
          if (count === 3) {
            state[neighborKey] = 1 // born;
          }
  
        }
      } else {
        if (state[key] === undefined) {
          const maxTrailAge = TRAIL_COLORS_BY_AGE.length;
          const trailAge = (age * -1) + 1;
  
          if (trailAge < maxTrailAge) {
            state[key] = age - 1;
          }
        }
      }
    })

    return state;
  }

  #getNeighboringCoordinates = (coord) => {
    const coordinates = []
  
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const isSelf = i === 0 && j === 0;
        if (isSelf) continue;
  
        const nx = coord[0] + i;
        const ny = coord[1] + j;
  
        coordinates.push([nx, ny])
      }
    }
  
    return coordinates;
  }

  #getLiveCellsCount = (coordinates, state) => {
    let count = 0;
  
    coordinates.forEach((coordinate) => {
      const isAlive = state[String(coordinate)] > 0;
  
      if (isAlive) {
        count++;
      }
    })
  
    return count;
  }

  #draw (state) {
    const { CELL_SIZE } = this.#config;
    const { canvas, width, height } = this.#canvas;
    const { offsetX, offsetY } = this.#arena;

    const { top, left } = canvas.getBoundingClientRect();
    
    canvas.width = width; // clear canvas
    
    Object.entries(state).forEach(([key, age]) => {
      const [x, y] = this.#stringToCoordinate(key);

      const isOutOfBound = (
        (x + 1) * CELL_SIZE + offsetX < left || 
        (y + 1) * CELL_SIZE + offsetY < top ||
        x * CELL_SIZE + offsetX > left + width ||
        y * CELL_SIZE + offsetY > top + height
      )

      if (!isOutOfBound) {
        this.#drawRectangle(x, y, age);
      }
    });
  }

  #drawRectangle (x, y, age) {
    const { CELL_SIZE } = this.#config;
    const { ctx } = this.#canvas;
    const { offsetX, offsetY } = this.#arena;

    ctx.beginPath();
    ctx.fillStyle = this.#getColor(age);
    ctx.rect(
      offsetX + x * CELL_SIZE,
      offsetY + y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE,
    );
    ctx.closePath();
    ctx.fill();
  }

  #getCanvas () {
    const { width, height } = this.parentElement.getBoundingClientRect();
    const canvas = this._shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    return {
      canvas,
      ctx,
      width,
      height,
    }
  }

  #getArena (canvas) {
    const { CELL_SIZE } = this.#config;
    const { width, height } = canvas;

    const xCellCount = Math.floor(width / CELL_SIZE);
    const yCellCount = Math.floor(height / CELL_SIZE);  
  
    const offsetX = Math.floor((width % CELL_SIZE) / 2);
    const offsetY = Math.floor((height % CELL_SIZE) / 2);

    return {
      offsetX,
      offsetY,
      xCellCount,
      yCellCount,
    }
  }

  #getPattern () {
    const { xCellCount, yCellCount } = this.#arena;
    const { INITIAL_PATTERN } = this.#config;

    const middleX = Math.floor(xCellCount / 2);
    const middleY = Math.floor(yCellCount / 2);

    return this.#plainTextToStateObject(
      INITIAL_PATTERN,
      [
        middleX - Math.floor(INITIAL_PATTERN[0].length / 2),
        middleY - Math.floor(INITIAL_PATTERN.length / 2),
      ],
    );
  }

  #getRandomizedState () {
    const { INITIAL_DENSITY } = this.#config;
    const { xCellCount, yCellCount } = this.#arena;

    const initialCellCount = Math.round(INITIAL_DENSITY * xCellCount * yCellCount);
    const state = {}

    for (let i = 0; i < initialCellCount; i++) {
      let coord = null;

      do {
        const x = this.#getRandomInt(0, xCellCount - 1);
        const y = this.#getRandomInt(0, yCellCount - 1);

        coord = [x, y];
      } while (state[String(coord)] !== undefined);
  
      state[String(coord)] = 1; // born
    }

    return state;
  }

  #getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  #stringToCoordinate (str) {
    const arr = str.split(',')

    return [Number(arr[0]), Number(arr[1])];
  }

  #getColor (age) {
    if (age > 0) {
      const { COLORS_BY_AGE } = this.#config;
      const index = age - 1

      if (index > COLORS_BY_AGE.length - 1) {
        return COLORS_BY_AGE.at(-1)
      }
  
      return COLORS_BY_AGE[index];
    }
    // handle trail color
    const { TRAIL_COLORS_BY_AGE } = this.#config;
    const index = Math.abs((age));

    return TRAIL_COLORS_BY_AGE[index];
  }

  #plainTextToStateObject (arr, topLeft) {
    const [x, y] = topLeft;
    const obj = {}

    arr.forEach((rowStr, rowIndex) => {
      const row = rowStr.split("");
      row.forEach((col, colIndex) => {
        if (col === "o") {
          const key = String([x + colIndex, y + rowIndex])
          obj[key] = 1;
        }
      })
    })

    return obj
  }
}

customElements.define('game-of-life', GameOfLife);
