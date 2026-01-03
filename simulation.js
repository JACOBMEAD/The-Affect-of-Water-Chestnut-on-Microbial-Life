class TrapaNatansSimulation {
  constructor() {
    this.state = {
      season: 'summer',
      waterDepth: 5,
      chestnutCoverage: 30,
      nutrientLevel: 5,
      waterMovement: 5
    };
    
    this.magnification = 100; // Default magnification (100x)
    
    this.ecosystemData = {
      waterClarity: 75,
      sedimentOxygen: 6.5,
      stratificationRisk: 45,
      dissolvedOxygen: 7.2,
      nutrientAvailability: 5.0,
      decompositionRate: 5.0,
      microbialBiomass: 450,
      microbialDiversity: 0.75,
      aerobicMicrobes: 65,
      anaerobicMicrobes: 35
    };
    
    this.microbes = [];
    this.openaiApiKey = this.loadApiKeyFromEnv();
    
    // Track current season and coverage to only regenerate when necessary
    this.currentSeason = null; // Will be set on first update
    this.currentCoverage = -1; // Will be set on first update
    this.currentWaterMovement = -1; // Will be set on first update
    this.currentNutrientLevel = -1; // Will be set on first update
    this.currentWaterDepth = -1; // Will be set on first update
    this.padAnimationFrame = null; // For animation loop
    
    // Debouncing for AI text generation
    this.aiTextDebounceTimer = null;
    this.lastAiTextRequest = null;
    
    this.init();
  }
  
  loadApiKeyFromEnv() {
    // Try to load from environment variable first
    if (typeof process !== 'undefined' && process.env && process.env.openai_api) {
      return process.env.openai_api;
    }
    
    // Fallback for browser environment - try to get from .env file
    fetch('.env')
      .then(response => response.text())
      .then(data => {
        const match = data.match(/^openai_api=(.+)$/m);
        if (match) {
          this.openaiApiKey = match[1].trim();
        }
      })
      .catch(() => {
        console.warn('Could not load API key from .env file');
      });
    
    // Return empty string initially, will be updated by fetch
    return '';
  }
  
  init() {
    this.createHTML();
    this.bindEvents();
    
    // Initialize CSS variables
    const root = document.documentElement;
    root.style.setProperty('--base-height', '60px');
    root.style.setProperty('--nutrient-factor', '1.0');
    root.style.setProperty('--water-depth-factor', '1.0');
    
    // Initialize depth
    this.updateDepth(this.state.waterDepth);
    
    // Initialize seasonal bottom behavior
    this.updateBottomBySeason(this.state.season);
    
    this.updateSimulation();
    this.initializeMicrobes();
    this.startAnimation();
  }
  
  updateDepth(depth) {
  const canvas = document.querySelector('.main-canvas');
  const underwater = document.querySelector('.underwater-scene');
  const bottom = document.querySelector('.bottom-vegetation');
  const light = document.querySelector('.light-penetration');

  // Canvas grows with depth - restore scaling feature
  const canvasHeight = 480 + depth * 30; // Base 480px, grows up to ~780px
  canvas.style.height = `${canvasHeight}px`;

  // Underwater fills remaining space
  const underwaterHeight = canvasHeight - 120;
  underwater.style.height = `${underwaterHeight}px`;

  // Bottom proxy shrinks as depth increases
  const bottomHeight = Math.max(60, 200 - depth * 15);
  bottom.style.height = `${bottomHeight}px`;

  // Light penetration decreases
  light.style.height = `${Math.max(90, 300 - depth * 20)}px`;

  // Darker water at depth
  underwater.style.filter = `brightness(${1 - depth * 0.03})`;
  
  console.log(`Depth: ${depth}m → Canvas: ${canvasHeight}px, Underwater: ${underwaterHeight}px, Bottom: ${bottomHeight}px`);
}

updateBottomBySeason(season) {
  const bottom = document.querySelector('.bottom-vegetation');
  const plants = document.querySelectorAll('.bottom-plant');

  let color, density, heightMultiplier;

  switch (season) {
    case 'spring':
      color = 'rgba(90, 180, 90, 0.9)';
      density = 1.2;
      heightMultiplier = 1.1;
      break;

    case 'summer':
      color = 'rgba(34, 139, 34, 0.95)';
      density = 1.5;
      heightMultiplier = 1.3;
      break;

    case 'fall':
      color = 'rgba(110, 140, 60, 0.85)';
      density = 0.9;
      heightMultiplier = 0.9;
      break;

    case 'winter':
      color = 'rgba(70, 90, 70, 0.7)';
      density = 0.4;
      heightMultiplier = 0.6;
      break;
  }

  bottom.style.background = `linear-gradient(to top,
    ${color} 0%,
    rgba(34, 139, 34, 0.4) 60%,
    transparent 100%)`;

  plants.forEach(p => {
    p.style.height = `${parseFloat(p.dataset.baseHeight) * heightMultiplier}px`;
    p.style.opacity = density;
  });
}

generateBottomPlants(count = 40) {
  const bottom = document.querySelector('.bottom-vegetation');
  bottom.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const plant = document.createElement('div');
    plant.className = 'bottom-plant';

    const baseHeight = 50 + Math.random() * 110;
    const width = 2 + Math.random() * 2;

    plant.dataset.baseHeight = baseHeight;
    plant.style.height = `${baseHeight}px`;
    plant.style.width = `${width}px`;
    plant.style.left = `${Math.random() * 100}%`;
    plant.style.animationDelay = `${Math.random() * 4}s`;
    plant.style.animationDuration = `${4 + Math.random() * 4}s`;

    bottom.appendChild(plant);
  }
}

updateChestnutSeeds(season, seedCount, waterDepth) {
  const seedLayer = document.querySelector('.water-chestnut-layer');
  if (!seedLayer) return;
  
  seedLayer.innerHTML = '';

  if (season === 'fall') {
    for (let i = 0; i < seedCount; i++) {
      const seed = document.createElement('div');
      seed.className = 'chestnut-seed sinking';
      seed.style.left = `${Math.random() * 100}%`;
      seed.style.transform = 'translateY(0px)';
      seedLayer.appendChild(seed);
      
      const finalY = 120 + waterDepth * 10;
      seed.animate([
        { transform: 'translateY(0px)' },
        { transform: `translateY(${finalY}px)` }
      ], { duration: 4000, easing: 'ease-in', fill: 'forwards' });
    }
  } else if (season === 'winter') {
    for (let i = 0; i < seedCount; i++) {
      const seed = document.createElement('div');
      seed.className = 'chestnut-seed bottom';
      seed.style.left = `${Math.random() * 100}%`;
      seedLayer.appendChild(seed);
    }
  }
}

setSpringChestnutGrowth() {
  const pads = document.querySelectorAll('.chestnut-pad');

  pads.forEach(pad => {
    pad.style.transform = 'translateY(20px) scale(0.6)';
    pad.style.opacity = '0.8';

    setTimeout(() => {
      pad.style.transform = 'translateY(0) scale(1)';
      pad.style.opacity = '1';
    }, 300);
  });
}

setWinterChestnutState() {
  const pads = document.querySelectorAll('.chestnut-pad');
  pads.forEach(pad => {
    pad.style.opacity = '0.4';
    pad.style.filter = 'grayscale(0.3) brightness(0.7)';
  });
}

setFallChestnutState() {
  const pads = document.querySelectorAll('.chestnut-pad');

  pads.forEach(pad => {
    pad.style.transform = 'scale(0.85)';
    pad.style.opacity = '0.8';
  });

  // Use the corrected seed system
  this.updateChestnutSeeds('fall', 25, this.state.waterDepth);
}

setSeason(season) {
  // Update bottom vegetation by season
  this.updateBottomBySeason(season);

  // Apply seasonal chestnut behavior with seed system
  if (season === 'fall') {
    this.setFallChestnutState();
  } else if (season === 'winter') {
    this.updateChestnutSeeds('winter', 0, 0); // no seeds in winter
  } else if (season === 'spring') {
    this.updateChestnutSeeds('spring', 0, 0);
  }
}
  
  createHTML() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="simulation-container">
        <!-- Control Panel -->
        <div class="control-panel">
          <h2 class="text-2xl font-bold mb-6 text-blue-900">Ecosystem Controls</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Water Depth Slider -->
            <div class="control-group">
              <label class="control-label">
                Water Depth: <span id="depthValue">5</span> meters
              </label>
              <input type="range" id="depthSlider" class="slider" 
                     min="1" max="10" value="5" step="0.5">
            </div>
            
            <!-- Water Chestnut Coverage Slider -->
            <div class="control-group">
              <label class="control-label">
                Water Chestnut Coverage: <span id="coverageValue">30</span>%
              </label>
              <input type="range" id="coverageSlider" class="slider" 
                     min="0" max="100" value="30" step="5">
            </div>
            
            <!-- Nutrient Level Slider -->
            <div class="control-group">
              <label class="control-label">
                Nutrient Level: <span id="nutrientValue">5</span>/10
              </label>
              <input type="range" id="nutrientSlider" class="slider" 
                     min="1" max="10" value="5" step="1">
            </div>
            
            <!-- Water Movement Slider -->
            <div class="control-group">
              <label class="control-label">
                Water Movement: <span id="movementValue">5</span>/10
              </label>
              <input type="range" id="movementSlider" class="slider" 
                     min="1" max="10" value="5" step="1">
            </div>
            
            <!-- Season Selection -->
            <div class="control-group md:col-span-2">
              <label class="control-label">Season</label>
              <div class="season-buttons">
                <button class="season-btn" data-season="spring">Spring</button>
                <button class="season-btn active" data-season="summer">Summer</button>
                <button class="season-btn" data-season="fall">Fall</button>
                <button class="season-btn" data-season="winter">Winter</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Visualization Area -->
        <div class="visualization-area">
          <h2 class="text-2xl font-bold mb-6 text-blue-900">Ecosystem Visualization</h2>
          <div class="main-canvas" id="mainCanvas">
            <div class="water-chestnut-layer" id="chestnutLayer"></div>
            <div class="light-penetration" id="lightPenetration"></div>
            <div class="seed-layer" id="seedLayer"></div>
            <div class="underwater-scene" id="underwaterScene">
              <div class="bottom-vegetation" id="bottomVegetation"></div>
            </div>
            <div class="microscope-overlay" id="microscopeOverlay">
              <!-- Resize Handle -->
              <div class="resize-handle" id="resizeHandle"></div>
            </div>
            <!-- Magnification Controls -->
            <div class="magnification-controls" id="magnificationControls">
              <button id="zoomOut" class="zoom-btn zoom-out">−</button>
              <div class="magnification-display">
                <span id="magnificationValue">100x</span>
              </div>
              <button id="zoomIn" class="zoom-btn zoom-in">+</button>
            </div>
          </div>
        </div>
        
        <!-- Ecosystem Data Display -->
        <div class="data-display">
          <h2 class="text-2xl font-bold mb-6 text-blue-900">Ecosystem Response Variables</h2>
          <div class="data-grid">
            <div class="data-item">
              <div class="data-label">Water Clarity</div>
              <div class="data-value"><span id="waterClarity">75</span><span class="data-unit">%</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Sediment Oxygen</div>
              <div class="data-value"><span id="sedimentOxygen">6.5</span><span class="data-unit">mg/L</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Stratification Risk</div>
              <div class="data-value"><span id="stratificationRisk">30</span><span class="data-unit">%</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Dissolved Oxygen</div>
              <div class="data-value"><span id="dissolvedOxygen">8.2</span><span class="data-unit">mg/L</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Nutrient Availability</div>
              <div class="data-value"><span id="nutrientAvailability">4.5</span><span class="data-unit">mg/L</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Decomposition Rate</div>
              <div class="data-value"><span id="decompositionRate">3.2</span><span class="data-unit">g/m²/day</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Microbial Biomass</div>
              <div class="data-value"><span id="microbialBiomass">450</span><span class="data-unit">μgC/L</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Microbial Diversity</div>
              <div class="data-value"><span id="microbialDiversity">0.75</span><span class="data-unit">index</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Aerobic Microbes</div>
              <div class="data-value"><span id="aerobicMicrobes">65</span><span class="data-unit">%</span></div>
            </div>
            <div class="data-item">
              <div class="data-label">Anaerobic Microbes</div>
              <div class="data-value"><span id="anaerobicMicrobes">35</span><span class="data-unit">%</span></div>
            </div>
          </div>
        </div>
        
        <!-- Educational Panel Toggle Button -->
        <div class="mb-4 text-center">
          <button id="educationToggle" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-md">
            <span id="toggleIcon">▼</span> <span id="toggleText">Show Ecological Processes</span>
          </button>
        </div>
        
        <!-- Educational Panel -->
        <div class="education-panel" id="educationPanel" style="display: none;">
          <div class="education-content" id="educationContent">
            <div class="education-title">Understanding Water Chestnut Impact</div>
            <p>Trapa natans (water chestnut) forms dense mats on the water surface that significantly alter freshwater ecosystem dynamics. These floating plants reduce light penetration, decrease dissolved oxygen levels, and create conditions that favor anaerobic microbial processes.</p>
            <br>
            <p><strong>Current Conditions:</strong> The ecosystem is showing moderate water chestnut coverage with typical summer conditions. Watch how changes in coverage, season, and environmental factors affect the microbial community and overall ecosystem health.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    // Education panel toggle
    document.getElementById('educationToggle').addEventListener('click', () => {
      this.toggleEducationPanel();
    });
    
    // Magnification controls
    document.getElementById('zoomIn').addEventListener('click', () => {
      this.changeMagnification(20);
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
      this.changeMagnification(-20);
    });
    
    // Slider events
    document.getElementById('depthSlider').addEventListener('input', (e) => {
      this.state.waterDepth = parseFloat(e.target.value);
      document.getElementById('depthValue').textContent = e.target.value;
      
      // Use the ONE depth variable function
      this.updateDepth(parseFloat(e.target.value));
      
      this.updateSimulation();
    });
    
    document.getElementById('coverageSlider').addEventListener('input', (e) => {
      this.state.chestnutCoverage = parseInt(e.target.value);
      document.getElementById('coverageValue').textContent = e.target.value;
      this.updateSimulation();
    });
    
    document.getElementById('nutrientSlider').addEventListener('input', (e) => {
      this.state.nutrientLevel = parseInt(e.target.value);
      document.getElementById('nutrientValue').textContent = e.target.value;
      this.updateSimulation();
    });
    
    document.getElementById('movementSlider').addEventListener('input', (e) => {
      this.state.waterMovement = parseInt(e.target.value);
      document.getElementById('movementValue').textContent = e.target.value;
      this.updateSimulation();
    });
    
    // Season button events
    document.querySelectorAll('.season-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.state.season = e.target.dataset.season;
        
        // Update seasonal bottom behavior
        this.updateBottomBySeason(this.state.season);
        
        this.updateSimulation();
      });
    });
  }
  
  toggleEducationPanel() {
    const educationPanel = document.getElementById('educationPanel');
    const toggleButton = document.getElementById('educationToggle');
    const toggleIcon = document.getElementById('toggleIcon');
    const toggleText = document.getElementById('toggleText');
    
    if (educationPanel.style.display === 'none') {
      // Show the panel
      educationPanel.style.display = 'block';
      toggleIcon.textContent = '▲';
      toggleText.textContent = 'Hide Ecological Processes';
      
      // Trigger AI text generation when panel is shown
      this.updateEcologicalText();
    } else {
      // Hide the panel
      educationPanel.style.display = 'none';
      toggleIcon.textContent = '▼';
      toggleText.textContent = 'Show Ecological Processes';
    }
  }
  
  changeMagnification(change) {
    // Prevent rapid clicking with debouncing
    if (this.isChangingMagnification) {
      return;
    }
    
    this.isChangingMagnification = true;
    
    // Calculate new magnification
    const newMagnification = this.magnification + change;
    
    // Validate range (40x to 1000x)
    if (newMagnification >= 40 && newMagnification <= 1000) {
      this.magnification = newMagnification;
      
      // Update display
      document.getElementById('magnificationValue').textContent = `${this.magnification}x`;
      
      console.log(`Magnification changing from ${this.magnification - change}x to ${this.magnification}x (change: ${change > 0 ? '+' : ''}${change})`);
      
      // Apply visual magnification effect
      this.applyMagnificationEffect();
      
      console.log(`Magnification changed to: ${this.magnification}x`);
    } else {
      console.log(`Magnification change rejected: ${newMagnification}x is out of range (40x-1000x)`);
    }
    
    // Reset debouncing after a short delay
    setTimeout(() => {
      this.isChangingMagnification = false;
    }, 100);
  }
  
  applyMagnificationEffect() {
    // Only update microscope content (microbes), not the circle size
    this.updateMicroscopeContent();
    
    // Position magnification controls next to microscope
    this.positionMagnificationControls();
  }
  
  positionMagnificationControls() {
    const microscopeOverlay = document.getElementById('microscopeOverlay');
    const magnificationControls = document.getElementById('magnificationControls');
    const mainCanvas = document.getElementById('mainCanvas');
    
    // Get microscope position
    const microscopeRect = microscopeOverlay.getBoundingClientRect();
    const canvasRect = mainCanvas.getBoundingClientRect();
    
    // Calculate position relative to canvas - place much further to the right
    const relativeRight = canvasRect.right - microscopeRect.right - 40; // Much more spacing
    const relativeTop = microscopeRect.top - canvasRect.top + microscopeRect.height / 2;
    
    // Position controls to the right of microscope with much more spacing
    magnificationControls.style.right = `${relativeRight}px`;
    magnificationControls.style.top = `${relativeTop}px`;
    magnificationControls.style.transform = 'translateY(-50%)';
    
    console.log('Positioning magnification controls:', { relativeRight, relativeTop });
  }
  
  updateMicroscopeContent() {
    // Adjust microbe visibility and size based on magnification
    const microbes = document.querySelectorAll('.microbe');
    const scaleFactor = this.magnification / 100;
    
    microbes.forEach(microbe => {
      // Use a consistent base size for all microbes
      const baseSize = 4; // Fixed base size for all microbes
      const newSize = baseSize * scaleFactor;
      microbe.style.width = `${newSize}px`;
      microbe.style.height = `${newSize}px`;
      
      // Store base data for consistent scaling
      if (!microbe.dataset.baseSize) {
        microbe.dataset.baseSize = baseSize;
      }
      
      // Adjust movement speed based on magnification
      const baseSpeed = 3; // Fixed base speed
      const newSpeed = baseSpeed / scaleFactor; // Faster movement at higher magnification
      microbe.style.animationDuration = `${newSpeed}s`;
      
      // Update microbe object data for consistent movement boundaries
      const microbeObj = this.microbes.find(m => m.element === microbe);
      if (microbeObj) {
        microbeObj.baseSize = baseSize;
        microbeObj.currentSize = newSize;
      }
    });
  }
  
  calculateEcosystemResponse() {
    const { waterDepth, chestnutCoverage, season, nutrientLevel, waterMovement } = this.state;
    
    // Use static calculations instead of AI calls
    this.calculateEcosystemResponseStatic();
  }
  
  calculateEcosystemResponseStatic() {
    const { waterDepth, chestnutCoverage, season, nutrientLevel, waterMovement } = this.state;
    
    // Static ecosystem calculations based on slider values
    const waterSpeedCmPerSec = waterMovement * 2; // Convert 1-10 to 2-20 cm/s
    const totalPhosphorus = nutrientLevel * 7.5; // Convert 1-10 to 7.5-75 µg/L
    
    // Calculate realistic ecosystem metrics
    this.ecosystemData = {
      waterClarity: Math.max(20, 100 - chestnutCoverage * 0.8 - waterDepth * 5),
      sedimentOxygen: Math.max(2, 8 - chestnutCoverage * 0.05 - waterDepth * 0.3),
      stratificationRisk: Math.min(100, waterDepth * 8 + waterMovement * 2),
      dissolvedOxygen: Math.max(3, 12 - chestnutCoverage * 0.08 - waterDepth * 0.5),
      nutrientAvailability: totalPhosphorus,
      decompositionRate: season === 'fall' ? 8 : season === 'winter' ? 2 : season === 'spring' ? 5 : 6,
      microbialBiomass: Math.min(1000, 200 + totalPhosphorus * 8 + (season === 'summer' ? 200 : 0)),
      microbialDiversity: Math.max(0.2, 1.0 - chestnutCoverage * 0.008 - waterDepth * 0.05),
      aerobicMicrobes: Math.max(20, 80 - chestnutCoverage * 0.5 - waterDepth * 3),
      anaerobicMicrobes: Math.max(0, 100 - this.ecosystemData.aerobicMicrobes)
    };
    
    console.log('Ecosystem data calculated (static):', this.ecosystemData);
  }
  
  calculateEcosystemResponseFallback() {
    // Original calculation method as fallback
    const { waterDepth, chestnutCoverage, season, nutrientLevel, waterMovement } = this.state;
    
    const seasonFactors = {
      spring: { temp: 0.6, light: 0.7, decomposition: 0.4 },
      summer: { temp: 1.0, light: 1.0, decomposition: 0.8 },
      fall: { temp: 0.7, light: 0.5, decomposition: 1.0 },
      winter: { temp: 0.3, light: 0.3, decomposition: 0.2 }
    };
    
    const seasonFactor = seasonFactors[season];
    
    this.ecosystemData.waterClarity = Math.max(10, 100 - (chestnutCoverage * 0.8) - (waterDepth * 2));
    this.ecosystemData.sedimentOxygen = Math.max(0, 8 - (chestnutCoverage * 0.05) - (waterDepth * 0.3) + (waterMovement * 0.2));
    this.ecosystemData.stratificationRisk = Math.min(100, (waterDepth * 8) + (chestnutCoverage * 0.3) + (seasonFactor.temp * 20));
    this.ecosystemData.dissolvedOxygen = Math.max(0, 10 - (chestnutCoverage * 0.06) - (seasonFactor.temp * 2) + (waterMovement * 0.3));
    
    const dieOffFactor = season === 'fall' ? 1.5 : (season === 'winter' ? 1.2 : 1.0);
    this.ecosystemData.nutrientAvailability = nutrientLevel * dieOffFactor + (chestnutCoverage * 0.02);
    this.ecosystemData.decompositionRate = (seasonFactor.decomposition * 4) + (chestnutCoverage * 0.03);
    this.ecosystemData.microbialBiomass = 200 + (this.ecosystemData.nutrientAvailability * 50) + (seasonFactor.temp * 100);
    
    const oxygenStress = Math.abs(this.ecosystemData.dissolvedOxygen - 5) / 5;
    this.ecosystemData.microbialDiversity = Math.max(0.2, 1.0 - (oxygenStress * 0.3) - (chestnutCoverage * 0.003));
    
    const oxygenRatio = this.ecosystemData.dissolvedOxygen / 10;
    this.ecosystemData.aerobicMicrobes = Math.max(10, Math.min(90, oxygenRatio * 80 + (waterMovement * 5)));
    this.ecosystemData.anaerobicMicrobes = 100 - this.ecosystemData.aerobicMicrobes;
  }
  
  updateDisplay() {
    // Update all data displays with smooth transitions
    this.updateDataDisplay('waterClarity', this.ecosystemData.waterClarity.toFixed(0), '%');
    this.updateDataDisplay('sedimentOxygen', this.ecosystemData.sedimentOxygen.toFixed(1), 'mg/L');
    this.updateDataDisplay('stratificationRisk', this.ecosystemData.stratificationRisk.toFixed(0), '%');
    this.updateDataDisplay('dissolvedOxygen', this.ecosystemData.dissolvedOxygen.toFixed(1), 'mg/L');
    this.updateDataDisplay('nutrientAvailability', this.ecosystemData.nutrientAvailability.toFixed(1), 'mg/L');
    this.updateDataDisplay('decompositionRate', this.ecosystemData.decompositionRate.toFixed(1), 'g/m²/day');
    this.updateDataDisplay('microbialBiomass', this.ecosystemData.microbialBiomass.toFixed(0), 'μgC/L');
    this.updateDataDisplay('microbialDiversity', this.ecosystemData.microbialDiversity.toFixed(2), 'index');
    this.updateDataDisplay('aerobicMicrobes', this.ecosystemData.aerobicMicrobes.toFixed(0), '%');
    this.updateDataDisplay('anaerobicMicrobes', this.ecosystemData.anaerobicMicrobes.toFixed(0), '%');
  }
  
  updateDataDisplay(elementId, value, unit) {
    const element = document.getElementById(elementId);
    const parent = element.parentElement;
    element.textContent = value;
    
    // Color coding based on values
    const numValue = parseFloat(value);
    if (elementId === 'dissolvedOxygen' || elementId === 'sedimentOxygen') {
      if (numValue < 3) parent.style.color = '#ff6b35';
      else if (numValue < 5) parent.style.color = '#ffa500';
      else parent.style.color = '#0077be';
    } else if (elementId === 'waterClarity') {
      if (numValue < 30) parent.style.color = '#8b4513';
      else if (numValue < 60) parent.style.color = '#ffa500';
      else parent.style.color = '#0077be';
    }
  }
  
  // Seed lifecycle management
  updateSeedLifecycle(season) {
    const seedContainer = document.getElementById('seedContainer') || this.createSeedContainer();
    
    // If switching to winter and seeds are currently falling, stop them immediately
    if (season === 'winter' && this.seedDropInterval) {
      this.stopFallingAndPlaceOnBottom();
    }
    
    switch(season) {
      case 'fall':
        // Generate and drop seeds
        if (!this.seedsGenerated) {
          this.generateSeeds();
          this.dropSeeds();
          this.seedsGenerated = true;
        }
        break;
        
      case 'winter':
        // Seeds should already be on bottom, no dropping
        if (!this.seedsGenerated) {
          this.generateSeeds();
          this.placeSeedsOnBottom();
          this.seedsGenerated = true;
        }
        break;
        
      case 'spring':
        // Seeds turn to chestnuts, add slightly submerged pads
        this.seedsToChestnuts();
        this.addSubmergedPads();
        this.clearSeeds();
        this.seedsGenerated = false;
        break;
        
      case 'summer':
        // No seeds
        this.clearSeeds();
        this.seedsGenerated = false;
        break;
    }
  }
  
  stopFallingAndPlaceOnBottom() {
    // Stop any active seed dropping
    if (this.seedDropInterval) {
      clearInterval(this.seedDropInterval);
      this.seedDropInterval = null;
    }
    
    // Immediately place all seeds on bottom
    this.seeds.forEach(seed => {
      // Cancel any ongoing animations
      if (seed.animationFrame) {
        cancelAnimationFrame(seed.animationFrame);
      }
      
      // Place directly on bottom with winter positioning
      const finalTop = 94 + Math.random() * 4; // 94-98% - very bottom
      const finalLeft = 10 + Math.random() * 80; // 10-90% across width
      
      // Add slight variation to prevent straight line
      const bottomVariation = (Math.random() - 0.5) * 6; // -3% to +3% variation
      const adjustedLeft = finalLeft + bottomVariation;
      
      // Ensure seed stays within bounds
      const clampedLeft = Math.max(5, Math.min(95, adjustedLeft));
      
      seed.style.top = `${finalTop}%`;
      seed.style.left = `${clampedLeft}%`;
      seed.style.transition = 'none';
      seed.style.transform = `rotate(${(Math.random() - 0.5) * 30}deg)`;
      seed.style.zIndex = Math.floor(Math.random() * 5);
    });
    
    console.log('Stopped falling seeds and placed them on bottom for winter');
  }
  
  createSeedContainer() {
    const container = document.createElement('div');
    container.id = 'seedContainer';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '15';
    
    const canvas = document.querySelector('.main-canvas');
    canvas.appendChild(container);
    return container;
  }
  
  generateSeeds() {
    const seedContainer = document.getElementById('seedContainer');
    const numSeeds = Math.floor(Math.random() * 8) + 12; // 12-20 seeds
    
    for (let i = 0; i < numSeeds; i++) {
      const seed = document.createElement('div');
      seed.className = 'water-chestnut-seed';
      seed.style.position = 'absolute';
      seed.style.width = '8px';
      seed.style.height = '6px';
      seed.style.backgroundColor = '#8B4513';
      seed.style.borderRadius = '50%';
      seed.style.border = '1px solid #654321';
      seed.style.left = `${Math.random() * 80 + 10}%`; // Spread across width
      seed.style.top = '15px'; // Start near surface
      seed.style.transition = 'none'; // No transition for manual animation
      seed.style.opacity = '0.9';
      seed.style.zIndex = Math.floor(Math.random() * 5); // Random z-index for depth
      
      // Add slight horizontal drift
      const driftX = (Math.random() - 0.5) * 20; // -10px to +10px drift
      seed.dataset.driftX = driftX;
      
      seedContainer.appendChild(seed);
      this.seeds.push(seed);
    }
    
    console.log(`Generated ${numSeeds} seeds for fall`);
  }
  
  dropSeeds() {
    // Clear any existing seed drop interval
    if (this.seedDropInterval) {
      clearInterval(this.seedDropInterval);
    }
    
    let seedsDropped = 0;
    const totalSeeds = this.seeds.length;
    
    // Start dropping seeds gradually
    this.seedDropInterval = setInterval(() => {
      if (seedsDropped >= totalSeeds) {
        clearInterval(this.seedDropInterval);
        this.seedDropInterval = null;
        return;
      }
      
      // Drop 1-2 seeds at a time for more natural falling
      const seedsToDrop = Math.random() > 0.7 ? 2 : 1;
      
      for (let i = 0; i < seedsToDrop && seedsDropped < totalSeeds; i++) {
        const seed = this.seeds[seedsDropped];
        this.animateSeedFall(seed);
        seedsDropped++;
      }
    }, 800); // Drop new seeds every 800ms
  }
  
  animateSeedFall(seed) {
    let currentTop = 15;
    const targetTop = 92 + Math.random() * 6; // 92-98% - very bottom of canvas
    const driftX = parseFloat(seed.dataset.driftX) || 0;
    const fallDuration = 4000 + Math.random() * 2000; // 4-6 seconds fall time
    const startTime = Date.now();
    const startLeft = parseFloat(seed.style.left);
    
    const animate = () => {
      // Store animation frame reference for cancellation
      seed.animationFrame = requestAnimationFrame(animate);
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / fallDuration, 1);
      
      // Ease-in-out falling animation
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Update vertical position
      currentTop = 15 + (targetTop - 15) * easeProgress;
      seed.style.top = `${currentTop}%`;
      
      // Update horizontal position with drift
      const currentLeft = startLeft + driftX * easeProgress;
      seed.style.left = `${currentLeft}%`;
      
      // Add slight swaying motion
      const sway = Math.sin(elapsed / 200) * 2;
      seed.style.transform = `translateX(${sway}px)`;
      
      if (progress < 1) {
        // Continue animation
      } else {
        // Seed has reached bottom - settle into natural position
        cancelAnimationFrame(seed.animationFrame);
        seed.animationFrame = null;
        this.settleSeedOnBottom(seed, currentLeft);
      }
    };
    
    seed.animationFrame = requestAnimationFrame(animate);
  }
  
  settleSeedOnBottom(seed, finalLeft) {
    // Create natural bottom distribution - not in straight line
    const bottomVariation = (Math.random() - 0.5) * 8; // -4% to +4% variation
    const finalTop = 94 + Math.random() * 4; // 94-98% - very bottom with variation
    const finalLeftPosition = finalLeft + bottomVariation;
    
    // Ensure seed stays within bounds
    const clampedLeft = Math.max(5, Math.min(95, finalLeftPosition));
    
    // Settle into final position
    seed.style.top = `${finalTop}%`;
    seed.style.left = `${clampedLeft}%`;
    seed.style.transform = 'translateX(0)';
    
    // Add bottom ripple effect
    this.addBottomRipple(seed);
    
    // Add slight rotation for natural resting position
    const finalRotation = (Math.random() - 0.5) * 30; // -15 to +15 degrees
    setTimeout(() => {
      seed.style.transform = `rotate(${finalRotation}deg)`;
    }, 500);
  }
  
  addBottomRipple(seed) {
    // Add small ripple effect when seed hits bottom
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.width = '20px';
    ripple.style.height = '10px';
    ripple.style.border = '1px solid rgba(139, 69, 19, 0.3)';
    ripple.style.borderRadius = '50%';
    ripple.style.left = seed.style.left;
    ripple.style.top = seed.style.top;
    ripple.style.opacity = '0.5';
    ripple.style.transition = 'all 1s ease-out';
    ripple.style.transform = 'scale(1)';
    
    const seedContainer = document.getElementById('seedContainer');
    seedContainer.appendChild(ripple);
    
    setTimeout(() => {
      ripple.style.transform = 'scale(2)';
      ripple.style.opacity = '0';
    }, 100);
    
    setTimeout(() => {
      ripple.remove();
    }, 1100);
  }
  
  placeSeedsOnBottom() {
    // Place seeds directly on bottom for winter with natural distribution
    this.seeds.forEach((seed, index) => {
      // Natural bottom position - very bottom of canvas
      const finalTop = 94 + Math.random() * 4; // 94-98% - very bottom
      const finalLeft = 10 + Math.random() * 80; // 10-90% across width
      
      // Add slight variation to prevent straight line
      const bottomVariation = (Math.random() - 0.5) * 6; // -3% to +3% variation
      const adjustedLeft = finalLeft + bottomVariation;
      
      // Ensure seed stays within bounds
      const clampedLeft = Math.max(5, Math.min(95, adjustedLeft));
      
      seed.style.top = `${finalTop}%`;
      seed.style.left = `${clampedLeft}%`;
      seed.style.transition = 'none'; // No animation for winter
      
      // Add natural resting rotation
      const finalRotation = (Math.random() - 0.5) * 30; // -15 to +15 degrees
      seed.style.transform = `rotate(${finalRotation}deg)`;
      
      // Random z-index for depth perception
      seed.style.zIndex = Math.floor(Math.random() * 5);
    });
  }
  
  seedsToChestnuts() {
    // Transform seeds into small chestnuts in spring
    this.seeds.forEach(seed => {
      seed.style.backgroundColor = '#654321';
      seed.style.width = '12px';
      seed.style.height = '10px';
      seed.style.borderRadius = '40%';
      seed.style.transform = 'rotate(45deg)';
      seed.style.transition = 'all 1s ease';
      
      // Add small green sprout
      setTimeout(() => {
        const sprout = document.createElement('div');
        sprout.style.position = 'absolute';
        sprout.style.width = '4px';
        sprout.style.height = '6px';
        sprout.style.backgroundColor = '#228B22';
        sprout.style.borderRadius = '50%';
        sprout.style.top = '-3px';
        sprout.style.left = '2px';
        seed.appendChild(sprout);
      }, 500);
    });
  }
  
  addSubmergedPads() {
    // Add a few slightly submerged pads in spring
    const chestnutMat = document.querySelector('.chestnut-mat');
    const numSubmerged = Math.floor(Math.random() * 3) + 2; // 2-4 pads
    
    for (let i = 0; i < numSubmerged; i++) {
      const pad = document.createElement('div');
      pad.className = 'chestnut-pad submerged';
      pad.style.position = 'absolute';
      pad.style.width = '30px';
      pad.style.height = '25px';
      pad.style.backgroundColor = '#90EE90';
      pad.style.borderRadius = '50%';
      pad.style.opacity = '0.7';
      pad.style.border = '1px solid #228B22';
      pad.style.left = `${Math.random() * 70 + 15}%`;
      pad.style.top = '60%'; // Slightly submerged
      pad.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
      pad.style.zIndex = '5';
      
      chestnutMat.appendChild(pad);
    }
    
    console.log(`Added ${numSubmerged} submerged pads for spring`);
  }
  
  clearSeeds() {
    // Clear any active seed dropping
    if (this.seedDropInterval) {
      clearInterval(this.seedDropInterval);
      this.seedDropInterval = null;
    }
    
    const seedContainer = document.getElementById('seedContainer');
    if (seedContainer) {
      seedContainer.innerHTML = '';
    }
    this.seeds = [];
    this.activeSeedDrops = [];
    
    // Also clear submerged pads
    const submergedPads = document.querySelectorAll('.chestnut-pad.submerged');
    submergedPads.forEach(pad => pad.remove());
  }

  updateChestnutPads(season, chestnutCoverage, seasonChanged, visiblePads) {
    const chestnutLayer = document.getElementById('chestnutLayer');
    
    // If season changed, clear all pads and regenerate with new appearance
    if (seasonChanged) {
      chestnutLayer.innerHTML = '';
    }
    
    // Get existing mat or create new one
    let chestnutMat = chestnutLayer.querySelector('.chestnut-mat');
    if (!chestnutMat) {
      chestnutMat = document.createElement('div');
      chestnutMat.className = 'chestnut-mat';
      chestnutLayer.appendChild(chestnutMat);
    }
    
    // Seasonal parameters
    let maxPads, padSizeMultiplier, flowerChance, seedPodChance, seedChance;
    let leafColors, padOpacity, stemOpacity;
    
    switch(season) {
      case 'summer':
        maxPads = 25; // Further reduced from 40
        padSizeMultiplier = 1.2;
        flowerChance = 0.6;
        seedPodChance = 0.1;
        seedChance = 0;
        leafColors = ['#1a3009', '#2d5016', '#3a6b1f', '#4a7c2f', '#5a8c3f', '#6a9c4f'];
        padOpacity = 1;
        stemOpacity = 1;
        break;
        
      case 'fall':
        maxPads = 20; // Further reduced from 30
        padSizeMultiplier = 0.9;
        flowerChance = 0.2;
        seedPodChance = 0.4;
        seedChance = 0.1;
        leafColors = ['#2d5016', '#4a5d1f', '#5a6b2f', '#6a7c3f', '#7a8c4f', '#8a9c5f'];
        padOpacity = 0.85;
        stemOpacity = 0.7;
        break;
        
      case 'winter':
        maxPads = 6; // Further reduced from 8
        padSizeMultiplier = 0.6;
        flowerChance = 0;
        seedPodChance = 0.1;
        seedChance = 0.3;
        leafColors = ['#3a4d1f', '#4a5d2f', '#5a6b3f', '#6a7c4f', '#7a8c5f', '#8a9c6f'];
        padOpacity = 0.5;
        stemOpacity = 0.3;
        break;
        
      case 'spring':
        maxPads = 12; // Further reduced from 18
        padSizeMultiplier = 0.7;
        flowerChance = 0.05;
        seedPodChance = 0;
        seedChance = 0.2;
        leafColors = ['#7cb342', '#689f38', '#558b2f', '#4a7c2f', '#3a6b1f', '#2d5016'];
        padOpacity = 0.8;
        stemOpacity = 0.6;
        break;
        
      default:
        maxPads = 25; // Further reduced from 40
        padSizeMultiplier = 1;
        flowerChance = 0.4;
        seedPodChance = 0;
        seedChance = 0;
        leafColors = ['#1a3009', '#2d5016', '#3a6b1f', '#4a7c2f', '#5a8c3f', '#6a9c4f'];
        padOpacity = 1;
        stemOpacity = 1;
    }
    
    const currentPads = chestnutMat.querySelectorAll('.chestnut-pad').length;
    
    // Handle pad count changes
    if (seasonChanged) {
      // Season changed: clear all and regenerate with new appearance
      chestnutMat.innerHTML = '';
      for (let i = 0; i < visiblePads; i++) {
        this.createChestnutPad(chestnutMat, season, padSizeMultiplier, flowerChance, seedPodChance, leafColors, padOpacity, stemOpacity);
      }
    } else if (visiblePads > currentPads) {
      // Coverage increased: add more pads
      const padsToAdd = visiblePads - currentPads;
      for (let i = 0; i < padsToAdd; i++) {
        this.createChestnutPad(chestnutMat, season, padSizeMultiplier, flowerChance, seedPodChance, leafColors, padOpacity, stemOpacity);
      }
    } else if (visiblePads < currentPads) {
      // Coverage decreased: remove excess pads
      const padsToRemove = currentPads - visiblePads;
      const allPads = chestnutMat.querySelectorAll('.chestnut-pad');
      for (let i = 0; i < padsToRemove; i++) {
        if (allPads[i]) {
          allPads[i].remove();
        }
      }
    }
  }
  
  createChestnutPad(chestnutMat, season, padSizeMultiplier, flowerChance, seedPodChance, leafColors, padOpacity, stemOpacity) {
    const pad = document.createElement('div');
    pad.className = 'chestnut-pad visible'; // Remove 'floating' class - we'll handle animation in JS
    
    // Apply seasonal styles immediately using switch parameters
    pad.style.backgroundColor = leafColors[Math.floor(Math.random() * leafColors.length)];
    pad.style.opacity = padOpacity;
    pad.style.borderRadius = season === 'fall' ? '30%' : '50%'; // optional shape tweak
    pad.style.transition = 'all 0.5s'; // smooth seasonal change if needed
    
    // Add seasonal size variation - minimal for consistent sizing
    const sizeVariation = 0.98 + Math.random() * 0.04; // 0.98 to 1.02 (almost no variation)
    const padWidth = 50 * padSizeMultiplier * sizeVariation;
    const padHeight = 45 * padSizeMultiplier * sizeVariation;
    pad.style.width = `${padWidth}px`;
    pad.style.height = `${padHeight}px`;
    
    // Add natural rotation
    const rotation = Math.random() * 30 - 15;
    pad.style.transform += ` rotate(${rotation}deg)`;
    
    // Add slight random positioning for loose arrangement
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 8;
    pad.style.marginLeft = `${offsetX}px`;
    pad.style.marginTop = `${offsetY}px`;
    
    // Store original position for animation
    pad.dataset.originalX = offsetX;
    pad.dataset.originalY = offsetY;
    pad.dataset.originalRotation = rotation;
    pad.dataset.animationPhase = Math.random() * Math.PI * 2; // Random starting phase
    
    // Create seasonal leaf with appropriate colors
    const leaf = document.createElement('div');
    leaf.className = Math.random() > 0.5 ? 'chestnut-leaf-toothed' : 'chestnut-leaf-flat';
    
    // Apply seasonal color gradient
    const colorGradient = `linear-gradient(135deg, ${leafColors.join(', ')})`;
    leaf.style.background = colorGradient;
    
    pad.appendChild(leaf);
    
    // Add seasonal stem
    const stem = document.createElement('div');
    stem.className = 'chestnut-stem-thin waving';
    stem.style.opacity = stemOpacity;
    
    const stemHeight = 80 + Math.random() * 60;
    stem.style.height = `${stemHeight}px`;
    stem.style.bottom = `-${stemHeight - 5}px`;
    
    const stemCurve = Math.random() * 4 - 2;
    stem.style.left = `${50 + stemCurve}%`;
    
    pad.appendChild(stem);
    
    // Add seasonal flowers
    if (Math.random() < flowerChance) {
      const flower = document.createElement('div');
      flower.className = 'chestnut-flower-small visible nodding';
      
      const flowerX = 40 + Math.random() * 20;
      const flowerY = 20 + Math.random() * 10;
      flower.style.left = `${flowerX}%`;
      flower.style.top = `${flowerY}%`;
      flower.style.transform = 'translate(-50%, -50%)';
      
      const petals = document.createElement('div');
      petals.className = 'chestnut-flower-petals-small';
      
      const petalCount = 4 + Math.floor(Math.random() * 3);
      for (let j = 0; j < petalCount; j++) {
        const petal = document.createElement('div');
        petal.className = 'chestnut-flower-petal-small';
        const angle = (j / petalCount) * 360;
        const petalDistance = 5 + Math.random() * 2;
        petal.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${petalDistance}px)`;
        petals.appendChild(petal);
      }
      
      const center = document.createElement('div');
      center.className = 'chestnut-flower-center-small';
      petals.appendChild(center);
      
      flower.appendChild(petals);
      pad.appendChild(flower);
    }
    
    // Add seed pods in fall only
    if (season === 'fall' && Math.random() < seedPodChance) {
      const seedPod = document.createElement('div');
      seedPod.className = 'chestnut-seed-pod visible';
      pad.appendChild(seedPod);
    }
    
    chestnutMat.appendChild(pad);
  }
  
  updatePadAnimation(waterMovement) {
    // Cancel existing animation frame
    if (this.padAnimationFrame) {
      cancelAnimationFrame(this.padAnimationFrame);
    }
    
    // Get all pads and count for performance optimization
    const pads = document.querySelectorAll('.chestnut-pad');
    const padCount = pads.length;
    
    // Animation parameters based on water speed (1-10 scale) - more subtle
    const baseSpeed = 0.001; // Reduced base speed
    const speedMultiplier = Math.pow(waterMovement / 5, 1.2); // Less aggressive exponential scaling
    const animationSpeed = baseSpeed * speedMultiplier;
    
    // Movement intensity based on water speed - more visible across all seasons
    const maxMovement = Math.min(waterMovement * 0.4, 4); // Increased to 0.4-4px movement, capped at 4px
    const maxRotation = waterMovement * 0.6; // Increased to 0.6-6deg rotation
    
    // Add vertical bobbing intensity
    const maxVerticalMovement = waterMovement * 0.3; // 0.3-3px vertical movement
    
    // Performance optimization: reduce animation complexity for high pad counts
    const shouldOptimize = padCount > 30 && waterMovement > 7;
    const skipFactor = shouldOptimize ? Math.floor(padCount / 20) : 1; // Animate every nth pad for performance
    
    // Cache calculations to avoid repeated math operations
    const cachedData = [];
    pads.forEach((pad, index) => {
      cachedData[index] = {
        phase: parseFloat(pad.dataset.animationPhase) || 0,
        originalX: parseFloat(pad.dataset.originalX) || 0,
        originalY: parseFloat(pad.dataset.originalY) || 0,
        originalRotation: parseFloat(pad.dataset.originalRotation) || 0
      };
    });
    
    // Start animation loop
    const animate = (timestamp) => {
      // Only animate pads that need updating (performance optimization)
      for (let i = 0; i < padCount; i += skipFactor) {
        const pad = pads[i];
        const data = cachedData[i];
        
        if (!pad || !data) continue;
        
        // Calculate movement based on water speed - horizontal oscillation only (no row change)
        const oscillationX = Math.sin(timestamp * animationSpeed + data.phase) * maxMovement;
        const oscillationRotation = Math.sin(timestamp * animationSpeed * 0.6 + data.phase * 0.9) * maxRotation;
        
        // Add some chaotic movement for high water speeds (only at very high speeds)
        let chaosX = 0;
        if (waterMovement > 8) {
          chaosX = Math.sin(timestamp * animationSpeed * 2 + data.phase * 2) * (waterMovement - 8) * 1.5;
        }
        
        // Apply transformation - oscillate horizontally around original position only
        pad.style.marginLeft = `${data.originalX + oscillationX + chaosX}px`;
        // Keep Y position unchanged
        pad.style.marginTop = `${data.originalY}px`;
        pad.style.transform = `rotate(${data.originalRotation + oscillationRotation}deg)`;
        
        // For skipped pads in optimized mode, apply simplified oscillation
        if (skipFactor > 1) {
          for (let j = 1; j < skipFactor && (i + j) < padCount; j++) {
            const skippedPad = pads[i + j];
            const skippedData = cachedData[i + j];
            if (skippedPad && skippedData) {
              // Simplified horizontal oscillation for skipped pads
              const simpleOscillationX = Math.sin(timestamp * animationSpeed * 0.5 + skippedData.phase) * (maxMovement * 0.3);
              
              skippedPad.style.marginLeft = `${skippedData.originalX + simpleOscillationX}px`;
              skippedPad.style.marginTop = `${skippedData.originalY}px`;
              skippedPad.style.transform = `rotate(${skippedData.originalRotation}deg)`;
            }
          }
        }
      }
      
      this.padAnimationFrame = requestAnimationFrame(animate);
    };
    
    // Start the animation
    this.padAnimationFrame = requestAnimationFrame(animate);
  }
  
  updateVegetationAnimation(waterMovement) {
    // Get all grass stalk containers (not individual segments)
    const stalks = document.querySelectorAll('.vegetation-stalk');
    
    // Animation parameters based on water speed (1-10 scale)
    // Much slower movement with natural curvature
    const baseSpeed = 8; // Much slower base duration
    const speedMultiplier = 1 + (waterMovement - 1) * 0.05; // Very small scaling: 1.0 to 1.45x speed
    const animationDuration = baseSpeed / speedMultiplier; // Higher flow = slightly faster but still slow
    
    // Range of motion based on water speed - more curved tips with greater range
    const maxMovement = 4 + (waterMovement - 1) * 1.2; // 4-12.4px range (greater for tips)
    const maxRotation = 0.8 + (waterMovement - 1) * 0.3; // 0.8-3.5deg rotation (more curved tips)
    
    // Apply animation to all stalks with varying delays for natural effect
    stalks.forEach((stalk, index) => {
      const delay = Math.random() * 4; // Random delay for natural movement
      const movementVariation = 0.8 + Math.random() * 0.4; // 80-120% variation
      const rotationVariation = 0.9 + Math.random() * 0.2; // 90-110% variation
      
      // Create custom keyframes for each entire stalk with bottom pinned and curved tips
      const keyframes = `
        @keyframes stalk-sway-${index} {
          0%   { transform: translateX(-50%) rotate(${-maxRotation * rotationVariation}deg); transform-origin: bottom center; }
          20%  { transform: translateX(calc(-50% + ${maxMovement * movementVariation * 0.4}px)) rotate(${maxRotation * rotationVariation * 0.6}deg); transform-origin: bottom center; }
          40%  { transform: translateX(calc(-50% + ${maxMovement * movementVariation * 0.7}px)) rotate(${maxRotation * rotationVariation * 0.8}deg); transform-origin: bottom center; }
          60%  { transform: translateX(calc(-50% + ${maxMovement * movementVariation}px)) rotate(${maxRotation * rotationVariation}deg); transform-origin: bottom center; }
          80%  { transform: translateX(calc(-50% + ${maxMovement * movementVariation * 0.7}px)) rotate(${maxRotation * rotationVariation * 0.8}deg); transform-origin: bottom center; }
          100% { transform: translateX(-50%) rotate(${-maxRotation * rotationVariation}deg); transform-origin: bottom center; }
        }
      `;
      
      // Remove old style element if exists
      const oldStyleElement = document.getElementById(`stalk-keyframes-${index}`);
      if (oldStyleElement) {
        oldStyleElement.remove();
      }
      
      // Create new style element
      const styleElement = document.createElement('style');
      styleElement.id = `stalk-keyframes-${index}`;
      styleElement.textContent = keyframes;
      document.head.appendChild(styleElement);
      
      // Apply animation to entire stalk (not individual segments)
      stalk.style.animation = `stalk-sway-${index} ${animationDuration}s ease-in-out ${delay}s infinite`;
      stalk.style.transformOrigin = 'bottom center';
      
      // Also animate all segments within this stalk to move together
      const segments = stalk.querySelectorAll('.grass-segment');
      segments.forEach(segment => {
        segment.style.animation = 'none'; // Disable individual segment animation
        segment.style.transformOrigin = 'bottom center';
      });
    });
    
    console.log(`Updated vegetation animation: duration=${animationDuration.toFixed(2)}s, range=${maxMovement}px, rotation=${maxRotation}deg for ${stalks.length} stalks`);
  }
  
  updateSeedFading(waterMovement, season) {
    // Only apply fading in winter when seeds are present
    if (season !== 'winter') {
      console.log('Skipping seed fading - not winter');
      return; // Only fade seeds in winter
    }
    
    // Get all seed elements
    const seeds = document.querySelectorAll('.seed');
    console.log(`Found ${seeds.length} seeds for fading in ${season}`);
    
    if (seeds.length === 0) {
      console.log('No seeds found to fade');
      return;
    }
    
    // Calculate fading speed based on water movement
    // Higher water flow = faster fading, lower flow = slower fading
    const baseFadeSpeed = 15; // Base fade duration in seconds
    const fadeSpeedMultiplier = Math.max(0.3, 2.5 - (waterMovement - 1) * 0.2); // Higher flow = faster fade
    const fadeDuration = baseFadeSpeed * fadeSpeedMultiplier; // 45s to 4.5s range
    
    console.log(`Seed fading parameters: base=${baseFadeSpeed}s, multiplier=${fadeSpeedMultiplier}, duration=${fadeDuration}s`);
    
    // Apply fading animation to all seeds
    seeds.forEach((seed, index) => {
      const delay = Math.random() * 3; // Random delay for natural effect
      const fadeVariation = 0.8 + Math.random() * 0.4; // 80-120% variation
      
      console.log(`Applying fade to seed ${index}: duration=${(fadeDuration * fadeVariation).toFixed(2)}s, delay=${delay.toFixed(2)}s`);
      
      // Create custom keyframes for seed fading (one-time fade, not infinite)
      const keyframes = `
        @keyframes seed-fade-${index} {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      
      // Remove old style element if exists
      const oldStyleElement = document.getElementById(`seed-fade-keyframes-${index}`);
      if (oldStyleElement) {
        oldStyleElement.remove();
      }
      
      // Create new style element
      const styleElement = document.createElement('style');
      styleElement.id = `seed-fade-keyframes-${index}`;
      styleElement.textContent = keyframes;
      document.head.appendChild(styleElement);
      
      // Apply one-time fading animation (not infinite)
      seed.style.animation = `seed-fade-${index} ${fadeDuration * fadeVariation}s ease-in-out ${delay}s forwards`;
      
      // Remove seed after animation completes
      setTimeout(() => {
        console.log(`Seed ${index} faded and hidden`);
        if (seed.parentNode) {
          seed.style.display = 'none';
        }
      }, (fadeDuration * fadeVariation + delay) * 1000);
    });
    
    console.log(`Updated seed fading: duration=${fadeDuration.toFixed(2)}s for ${seeds.length} seeds in ${season}`);
  }
  
  updateVisualization() {
    console.log('=== UPDATE VISUALIZATION CALLED ===');
    const { waterDepth, chestnutCoverage, season, nutrientLevel, waterMovement } = this.state;
    
    // Calculate number of pads based on coverage percentage - exactly 20 pads at 100%, 1 pad per 5%
    const visiblePads = Math.floor((chestnutCoverage / 5)); // 1 pad per 5% coverage
    
    // Check if we need to update chestnut pads (first time, season change, or coverage change)
    const isFirstTime = this.currentSeason === null || this.currentCoverage === -1;
    const seasonChanged = season !== this.currentSeason;
    const coverageChanged = chestnutCoverage !== this.currentCoverage;
    const waterMovementChanged = waterMovement !== this.currentWaterMovement;
    const waterDepthChanged = waterDepth !== this.currentWaterDepth;
    
    // Handle nutrient level comparison separately to avoid string/number issues
    const nutrientNum = parseFloat(nutrientLevel);
    const currentNutrientNum = parseFloat(this.currentNutrientLevel);
    const nutrientLevelChanged = nutrientNum !== currentNutrientNum;
    
    console.log('=== DETAILED DEBUG ===');
    console.log(`nutrientLevel: ${nutrientLevel} (type: ${typeof nutrientLevel})`);
    console.log(`this.currentNutrientLevel: ${this.currentNutrientLevel} (type: ${typeof this.currentNutrientLevel})`);
    console.log(`nutrientLevel !== this.currentNutrientLevel: ${nutrientLevel !== this.currentNutrientLevel}`);
    console.log(`waterDepth: ${waterDepth} (type: ${typeof waterDepth})`);
    console.log(`this.currentWaterDepth: ${this.currentWaterDepth} (type: ${typeof this.currentWaterDepth})`);
    console.log(`waterDepth !== this.currentWaterDepth: ${waterDepth !== this.currentWaterDepth}`);
    
    if (isFirstTime || seasonChanged || coverageChanged) {
      this.updateChestnutPads(season, chestnutCoverage, seasonChanged, visiblePads);
      this.currentSeason = season;
      this.currentCoverage = chestnutCoverage;
      
      // Update seed lifecycle when season changes
      if (seasonChanged) {
        this.updateSeedLifecycle(season);
      }
    }
    
    // Update pad animation if water movement changed OR if there are pads
    if (isFirstTime || waterMovementChanged || visiblePads > 0) {
      this.updatePadAnimation(waterMovement);
      this.currentWaterMovement = waterMovement;
    }
    
    // Update vegetation animation based on water movement
    if (isFirstTime || waterMovementChanged) {
      this.updateVegetationAnimation(waterMovement);
    }
    
    // Update seed fading based on water movement
    if (isFirstTime || waterMovementChanged || seasonChanged) {
      this.updateSeedFading(waterMovement, season);
    }
    
    // Update ecosystem metrics based on season
    this.updateSeasonalEcosystemMetrics(season, chestnutCoverage);
    
    // Update vegetation if depth or nutrients changed (or first time)
    console.log('=== VEGETATION UPDATE DEBUG ===');
    console.log(`nutrientLevel from state: ${nutrientNum} (type: ${typeof nutrientNum})`);
    console.log(`this.currentNutrientLevel: ${currentNutrientNum} (type: ${typeof currentNutrientNum})`);
    console.log(`Comparison: ${nutrientNum} !== ${currentNutrientNum} = ${nutrientLevelChanged}`);
    console.log(`Checking vegetation update: isFirstTime=${isFirstTime}, waterDepthChanged=${waterDepthChanged}, nutrientLevelChanged=${nutrientLevelChanged}`);
    console.log(`Current values: depth=${waterDepth}, nutrients=${nutrientNum}`);
    console.log(`Stored values: currentDepth=${this.currentWaterDepth}, currentNutrients=${currentNutrientNum}`);
    
    if (isFirstTime || waterDepthChanged || nutrientLevelChanged) {
      console.log('VEGETATION UPDATE TRIGGERED!');
      
      // Update CSS variables for depth and nutrients
      const root = document.documentElement;
      
      // Depth effect: deeper water = shorter vegetation (inverse relationship)
      const depthFactor = Math.max(0.4, 1.1 - (waterDepth - 1) * 0.07); // 1.0 to 0.4
      root.style.setProperty('--water-depth-factor', depthFactor);
      
      // Nutrient effect: higher nutrients = larger vegetation (level 5 = 1.0, level 10 = 1.5)
      const nutrientFactor = 0.5 + (nutrientNum / 10) * 1.0; // 0.5 to 1.5
      root.style.setProperty('--nutrient-factor', nutrientFactor);
      
      // Set base height for all vegetation
      root.style.setProperty('--base-height', '60px');
      
      console.log(`Updated CSS: --water-depth-factor=${depthFactor}, --nutrient-factor=${nutrientFactor}, --base-height=60px`);
      
      // Generate grass stalks if it doesn't exist OR if nutrient level OR water depth changed
      const bottomVegetation = document.getElementById('bottomVegetation');
      if (!bottomVegetation || bottomVegetation.children.length === 0 || nutrientLevelChanged || waterDepthChanged) {
        console.log('Generating grass stalks - nutrient level or water depth changed or first time');
        
        // Clear existing grass stalks if regenerating
        if ((nutrientLevelChanged || waterDepthChanged) && bottomVegetation) {
          bottomVegetation.innerHTML = '';
        }
        
        // Generate grass stalks based on nutrient level (like chestnut pad coverage)
        // Every increase of 1 in nutrient level adds 2 grass stalks
        const numGrassStalks = Math.max(2, nutrientNum * 2); // 2-20 stalks (1-10 nutrients)
        
        console.log(`Generating ${numGrassStalks} grass stalks for nutrient level ${nutrientNum}`);
        
        for (let i = 0; i < numGrassStalks; i++) {
          const plant = document.createElement('div');
          plant.className = 'bottom-plant grass-stalk';
          plant.style.position = 'absolute';
          plant.style.bottom = '0px';
          
          // Even distribution like chestnut pads - centered and spread
          const spacing = 100 / (numGrassStalks + 1); // +1 for edge spacing
          const position = spacing * (i + 1); // Centered distribution
          
          plant.style.left = `${position}%`;
          
          // Create multiple overlapping swiggly grass stalks at each position
          const numOverlappingStalks = Math.floor(Math.random() * 2) + 2; // 2-3 stalks per position
          
          for (let k = 0; k < numOverlappingStalks; k++) {
            const grassStalk = document.createElement('div');
            grassStalk.className = 'vegetation-stalk grass-blade';
            
            // Base height varies with nutrients and water depth for visual feedback
            // Taller at shallow depths, shorter at deep depths, but not too small
            const depthFactor = Math.max(0.75, 1.3 - (waterDepth - 1) * 0.055); // 1.3 to 0.75 (taller at shallow, shorter at deep)
            const baseHeight = (25 + (nutrientNum * 5) + Math.random() * 20) * depthFactor; // 19-117px adjusted by depth
            
            // Width and thickness also decrease with depth but not too much
            const widthFactor = Math.max(0.8, 1.25 - (waterDepth - 1) * 0.045); // 1.25 to 0.8 (thicker at shallow, thinner at deep)
            const stalkWidth = (2 + (nutrientNum * 0.3)) * widthFactor; // Width varies with both nutrients and depth
            
            // Position overlapping stalks with slight offset
            const offsetX = (Math.random() - 0.5) * 8; // -4 to +4px horizontal offset
            const offsetY = (Math.random() - 0.5) * 4; // -2 to +2px vertical offset
            
            grassStalk.style.left = `50%`;
            grassStalk.style.bottom = '0px';
            grassStalk.style.position = 'absolute';
            grassStalk.style.zIndex = k; // Layer stalks
            
            // Create swiggly stalk using multiple segments but as one rigid unit
            const segments = 4 + Math.floor(Math.random() * 3); // 4-6 segments for curve
            let currentX = 0;
            
            for (let seg = 0; seg < segments; seg++) {
              const segment = document.createElement('div');
              segment.className = 'grass-segment';
              segment.dataset.stalkIndex = k; // Track which stalk this segment belongs to
              segment.dataset.segmentIndex = seg; // Track segment position
              
              const segmentHeight = baseHeight / segments;
              const segmentY = seg * segmentHeight;
              
              // Wiggle increases toward the tip for natural curve
              const wiggleAmount = (seg + 1) * 2; // More wiggle at top
              const wiggleX = (Math.random() - 0.5) * wiggleAmount;
              
              segment.style.position = 'absolute';
              segment.style.width = `${stalkWidth}px`;
              segment.style.height = `${segmentHeight}px`;
              segment.style.bottom = `${segmentY}px`;
              segment.style.left = '50%';
              segment.style.transform = `translateX(${currentX + wiggleX}px)`;
              segment.style.background = `linear-gradient(to top, 
                #2d5016 0%, 
                #4a7c2f 50%, 
                #6b8e4f 100%)`;
              segment.style.borderRadius = `${stalkWidth/2}px`;
              segment.style.opacity = '0.85';
              segment.style.transformOrigin = 'bottom center';
              
              grassStalk.appendChild(segment);
              currentX += wiggleX;
            }
            
            // Apply overall positioning and rotation to the entire stalk
            const curve = (Math.random() - 0.5) * 8; // -4 to +4 degrees
            const heightVariation = 0.9 + Math.random() * 0.2; // 90-110% of base height
            
            grassStalk.style.transform = `translateX(calc(-50% + ${offsetX}px)) rotate(${curve}deg)`;
            grassStalk.style.animationDelay = `${Math.random() * 2}s`;
            
            plant.appendChild(grassStalk);
          }
          bottomVegetation.appendChild(plant);
        }
        
        console.log('Grass stalks generated with', numGrassStalks, 'stalks centered like pads.');
      }
      
      // Update current values to prevent repeated updates
      this.currentNutrientLevel = nutrientNum;
      this.currentWaterDepth = waterDepth;
    } else {
      console.log('VEGETATION UPDATE NOT TRIGGERED - no changes detected');
    }
    
    // Adjust water color based on season
    let depthColorFactor = 1.0; // Initialize depth color factor
    if (season === 'summer') {
      depthColorFactor *= 0.8; // Darker due to shading
    } else if (season === 'fall') {
      depthColorFactor *= 0.9; // Slightly darker from decomposition
    } else if (season === 'winter') {
      depthColorFactor *= 1.1; // Clearer with less vegetation
    } else if (season === 'spring') {
      depthColorFactor *= 0.95; // Moderate clarity
    }
    
    // Apply water movement effects on clarity
    if (waterMovement > 7) {
      depthColorFactor *= 1.05; // Slightly clearer with high movement
    } else if (waterMovement < 3) {
      depthColorFactor *= 0.95; // Slightly murkier with low movement
    }
    
    // Update underwater scene color based on depth
    const underwaterScene = document.getElementById('underwaterScene');
    const waterColorTop = `rgba(0, ${119 * depthColorFactor}, ${190 * depthColorFactor}, ${0.2 * depthColorFactor})`;
    const waterColorBottom = `rgba(0, ${50 * depthColorFactor}, ${100 * depthColorFactor}, ${0.8})`;
    
    underwaterScene.style.background = `linear-gradient(to bottom, 
      ${waterColorTop} 0%, 
      rgba(0, ${90 * depthColorFactor}, ${150 * depthColorFactor}, ${0.4}) 20%,
      rgba(0, ${70 * depthColorFactor}, ${120 * depthColorFactor}, ${0.6}) 50%, 
      ${waterColorBottom} 100%)`;
    
    // Update educational panel with real-time ecosystem state
    this.updateEducationPanel();
  }
  
  updateSeasonalEcosystemMetrics(season, chestnutCoverage) {
    // Update ecosystem metrics based on seasonal water chestnut behavior
    let doMultiplier, nutrientMultiplier, decompositionMultiplier, microbialMultiplier;
    let clarityMultiplier, oxygenMultiplier, stratificationMultiplier;
    
    switch(season) {
      case 'summer':
        // Summer: High shading, low oxygen, high nutrient competition
        doMultiplier = 1 - (chestnutCoverage / 100) * 0.4;
        nutrientMultiplier = 1 - (chestnutCoverage / 100) * 0.3;
        decompositionMultiplier = 0.8; // Lower decomposition in warm, oxygen-poor water
        microbialMultiplier = 0.9; // Reduced microbial diversity
        clarityMultiplier = 1 - (chestnutCoverage / 100) * 0.5;
        oxygenMultiplier = 1 - (chestnutCoverage / 100) * 0.3;
        stratificationMultiplier = 1.2; // Higher stratification risk
        break;
        
      case 'fall':
        // Fall: Decomposition from dropping seeds, moderate oxygen
        doMultiplier = 1 - (chestnutCoverage / 100) * 0.2;
        nutrientMultiplier = 1 + (chestnutCoverage / 100) * 0.2; // Nutrient release from decomposition
        decompositionMultiplier = 1.3; // Higher decomposition
        microbialMultiplier = 1.1; // Increased microbial activity
        clarityMultiplier = 1 - (chestnutCoverage / 100) * 0.3;
        oxygenMultiplier = 1 - (chestnutCoverage / 100) * 0.15;
        stratificationMultiplier = 1.1;
        break;
        
      case 'winter':
        // Winter: Low coverage, high oxygen from cold water, continued decomposition
        doMultiplier = 1.1; // Higher DO from cold water
        nutrientMultiplier = 1 + (chestnutCoverage / 100) * 0.3; // Continued nutrient release
        decompositionMultiplier = 1.2; // Slow but steady decomposition
        microbialMultiplier = 0.8; // Lower microbial activity in cold
        clarityMultiplier = 1.1; // Clearer water
        oxygenMultiplier = 1.2; // Higher oxygen
        stratificationMultiplier = 0.9; // Lower stratification risk
        break;
        
      case 'spring':
        // Spring: Growing plants, increasing oxygen, moderate nutrients
        doMultiplier = 1 + (chestnutCoverage / 100) * 0.1; // Early photosynthesis
        nutrientMultiplier = 1 - (chestnutCoverage / 100) * 0.1; // Nutrient uptake begins
        decompositionMultiplier = 1.0; // Normal decomposition
        microbialMultiplier = 1.2; // Increasing microbial diversity
        clarityMultiplier = 1 - (chestnutCoverage / 100) * 0.2;
        oxygenMultiplier = 1 + (chestnutCoverage / 100) * 0.1;
        stratificationMultiplier = 1.0;
        break;
        
      default:
        doMultiplier = 1;
        nutrientMultiplier = 1;
        decompositionMultiplier = 1;
        microbialMultiplier = 1;
        clarityMultiplier = 1;
        oxygenMultiplier = 1;
        stratificationMultiplier = 1;
    }
    
    // Apply seasonal multipliers to ecosystem data
    this.ecosystemData.dissolvedOxygen = Math.round(this.ecosystemData.dissolvedOxygen * oxygenMultiplier);
    this.ecosystemData.nutrientAvailability = Math.round(this.ecosystemData.nutrientAvailability * nutrientMultiplier);
    this.ecosystemData.decompositionRate = Math.round(this.ecosystemData.decompositionRate * decompositionMultiplier);
    this.ecosystemData.microbialBiomass = Math.round(this.ecosystemData.microbialBiomass * microbialMultiplier);
    this.ecosystemData.waterClarity = Math.round(this.ecosystemData.waterClarity * clarityMultiplier);
    this.ecosystemData.stratificationRisk = Math.round(this.ecosystemData.stratificationRisk * stratificationMultiplier);
    
    // Update aerobic/anaerobic proportions
    const aerobicBase = this.ecosystemData.aerobicProportion;
    this.ecosystemData.aerobicProportion = Math.round(aerobicBase * oxygenMultiplier);
    this.ecosystemData.anaerobicProportion = 100 - this.ecosystemData.aerobicProportion;
    
    // Update display values
    this.updateDisplayValues();
  }
  
  updateDisplayValues() {
    // Update the display values for sliders
    document.getElementById('depthValue').textContent = this.state.waterDepth;
    document.getElementById('coverageValue').textContent = this.state.chestnutCoverage;
    document.getElementById('nutrientValue').textContent = this.state.nutrientLevel;
    document.getElementById('movementValue').textContent = this.state.waterMovement;
  }
  
  updateEducationPanel() {
    const { waterDepth, chestnutCoverage, season, nutrientLevel, waterMovement } = this.state;
    const data = this.ecosystemData;
    
    let content = '<div class="education-title">Current Ecological State</div>';
    
    // Water depth explanation through vegetation proxy
    let depthDescription = '';
    if (waterDepth < 3) {
      depthDescription = `shallow water (${waterDepth}m) shows tall, dense bottom vegetation reaching upward, indicating the lake floor is close to the surface with maximum light penetration and limited stratification`;
    } else if (waterDepth < 7) {
      depthDescription = `moderate depth (${waterDepth}m) displays medium-height vegetation, suggesting the floor is at an intermediate distance with balanced light penetration and moderate stratification potential`;
    } else {
      depthDescription = `deep water (${waterDepth}m) reveals short, compressed bottom vegetation, visually representing a distant lake floor with reduced light penetration and higher stratification risk`;
    }
    
    // Seasonal water chestnut analysis
    let seasonalDescription = '';
    let seasonalEffects = '';
    
    switch(season) {
      case 'spring':
        seasonalDescription = 'Spring emergence shows water chestnut seeds rising and small light green rosettes forming';
        seasonalEffects = `Early growth is increasing photosynthesis (+${data.dissolvedOxygen.toFixed(1)} mg/L DO) while beginning nutrient uptake. Light green rosettes are establishing with ${chestnutCoverage}% surface coverage.`;
        break;
        
      case 'summer':
        seasonalDescription = 'Summer peak growth with extensive water chestnut mats';
        seasonalEffects = `Dense coverage (${chestnutCoverage}%) creates severe shading, reducing water clarity to ${data.waterClarity.toFixed(0)}% and dissolved oxygen to ${data.dissolvedOxygen.toFixed(1)} mg/L. High stratification risk (${data.stratificationRisk.toFixed(0)}%).`;
        break;
        
      case 'fall':
        seasonalDescription = 'Fall senescence with seeds sinking and decomposition beginning';
        seasonalEffects = `Mature pads are releasing seeds that sink to the bottom. Decomposition is consuming oxygen (${data.dissolvedOxygen.toFixed(1)} mg/L) and releasing nutrients back into the system.`;
        break;
        
      case 'winter':
        seasonalDescription = 'Winter dormancy with seeds resting on sediment';
        seasonalEffects = `Seeds remain dormant on the lakebed while microbial activity slows. Low light penetration maintains reduced oxygen levels (${data.dissolvedOxygen.toFixed(1)} mg/L).`;
        break;
    }
    
    // Generate AI-powered ecological text and append to existing content
    // DISABLED: AI content is now handled by updateEcologicalText() function
    // console.log('Starting AI text generation...');
    // const currentValues = {
    //   season: this.state.season,
    //   waterDepth: this.state.waterDepth,
    //   chestnutCoverage: this.state.chestnutCoverage,
    //   nutrientLevel: this.state.nutrientLevel,
    //   waterMovement: this.state.waterMovement
    // };
    // this.generateEcologicalText(currentValues).then(aiText => {
    //   console.log('AI text received:', aiText);
    //   const aiContent = `
    //     <div class="education-content">
    //       <h3>AI Ecological Analysis</h3>
    //       <div style="white-space: pre-line;">${aiText}</div>
    //     </div>
    //   `;
    //   const educationPanel = document.querySelector('.education-panel');
    //   if (educationPanel) {
    //     educationPanel.innerHTML = aiContent;
    //     console.log('Education panel updated with AI content');
    //   }
    // }).catch(error => {
    //   console.error('Error generating AI text:', error);
    //   // Fallback content if AI fails
    //   const fallbackContent = `
    //     <div class="education-content">
    //       <h3>Ecological Analysis</h3>
    //       <p>Analysis temporarily unavailable. The ecosystem is responding to seasonal changes and water chestnut coverage...</p>
    //     </div>
    //   `;
    //   const educationPanel = document.querySelector('.education-panel');
    //   if (educationPanel) {
    //     educationPanel.innerHTML = fallbackContent;
    //     console.log('Education panel updated with fallback content');
    //   }
    // });
  }
  
  updateSimulation() {
    console.log('=== UPDATE SIMULATION CALLED ===');
    this.calculateEcosystemResponse();
    this.updateDisplay();
    this.updateVisualization();
    this.updateEducationPanel();
    this.updateMicrobes();
    
    // Use debounced AI text update to prevent excessive calls
    this.debouncedAiTextUpdate();
  }
  
  // Debounced AI text update
  debouncedAiTextUpdate() {
    // Clear existing timer
    if (this.aiTextDebounceTimer) {
      clearTimeout(this.aiTextDebounceTimer);
    }
    
    // Set new timer
    this.aiTextDebounceTimer = setTimeout(() => {
      this.updateEcologicalText();
      this.aiTextDebounceTimer = null;
    }, 500); // 500ms debounce
  }

  updateEcologicalText() {
    console.log('=== UPDATE ECOLOGICAL TEXT CALLED ===');
    
    // Force refresh of current values from DOM to ensure we have the latest
    const depthSlider = document.getElementById('depthSlider');
    const coverageSlider = document.getElementById('coverageSlider');
    const nutrientSlider = document.getElementById('nutrientSlider');
    const movementSlider = document.getElementById('movementSlider');
    
    const currentValues = {
      season: this.state.season,
      waterDepth: depthSlider ? parseFloat(depthSlider.value) : this.state.waterDepth,
      chestnutCoverage: coverageSlider ? parseInt(coverageSlider.value) : this.state.chestnutCoverage,
      nutrientLevel: nutrientSlider ? parseFloat(nutrientSlider.value) : this.state.nutrientLevel,
      waterMovement: movementSlider ? parseFloat(movementSlider.value) : this.state.waterMovement
    };
    
    console.log('Current DOM slider values:', currentValues);
    console.log('Current this.state values:', this.state);
    
    const ecologicalTextElement = document.getElementById('educationContent');
    console.log('Found educationContent element:', ecologicalTextElement);
    
    if (ecologicalTextElement) {
      // Show loading state
      ecologicalTextElement.innerHTML = `
        <div class="education-title">AI Ecological Analysis</div>
        <p><strong>Analyzing ecosystem conditions...</strong></p>
      `;
      console.log('Showing loading state');
      
      // Generate ecological text with static format
      const aiText = this.generateEcologicalText(currentValues);
      console.log('Ecological text received:', aiText);
      ecologicalTextElement.innerHTML = aiText;
      console.log('Ecological text updated with analysis');
    } else {
      console.log('ERROR: educationContent element NOT FOUND!');
    }
  }
  
  // Initialize microbes and attach the draggable feature to the microscope overlay
  initializeMicrobes() {
    const microscopeOverlay = document.getElementById('microscopeOverlay');
    this.microbes = [];

    // Make the microscope overlay draggable
    this.makeMicroscopeDraggable(microscopeOverlay);

    // Make the microscope resizable
    this.makeMicroscopeResizable(microscopeOverlay);

    // Position magnification controls
    this.positionMagnificationControls();

    // Create initial microbes scattered across the ecosystem (all hidden initially)
    // Molecular level has thousands of cells - create 200 for performance
    for (let i = 0; i < 200; i++) {
      this.createMicrobe();
    }
    
    // Initial reveal based on microscope position
    const microscopeX = parseFloat(microscopeOverlay.style.left) || 0;
    const microscopeY = parseFloat(microscopeOverlay.style.top) || 0;
    this.revealCellsAtPosition(microscopeX, microscopeY);
    
    // Start animation for independent cell movement
    this.startAnimation();
  }
  
  // Function to make the microscope field view draggable
  makeMicroscopeDraggable(microscope) {
    let isDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startMicroscopeX = 0;
    let startMicroscopeY = 0;

    // Set initial position to prevent jumping
    const parentRect = microscope.parentElement.getBoundingClientRect();
    const initialLeft = (parentRect.width - microscope.offsetWidth) / 2;
    const initialTop = parentRect.height - microscope.offsetHeight - 50;
    microscope.style.left = `${initialLeft}px`;
    microscope.style.top = `${initialTop}px`;

    // When mouse button is pressed down on the microscope
    microscope.addEventListener('mousedown', (e) => {
      e.preventDefault(); // Prevent text selection and other default behaviors
      isDragging = true;
      
      // Store initial positions
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startMicroscopeX = parseFloat(microscope.style.left) || 0;
      startMicroscopeY = parseFloat(microscope.style.top) || 0;
      
      microscope.style.cursor = 'grabbing';  // Change cursor to indicate dragging
    });

    // Move the microscope overlay with the cursor
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      // Calculate movement delta
      const deltaX = e.clientX - startMouseX;
      const deltaY = e.clientY - startMouseY;
      
      // Calculate new position
      let newLeft = startMicroscopeX + deltaX;
      let newTop = startMicroscopeY + deltaY;
      
      // Constrain to parent bounds
      const parentRect = microscope.parentElement.getBoundingClientRect();
      const maxX = parentRect.width - microscope.offsetWidth;
      const maxY = parentRect.height - microscope.offsetHeight;
      
      newLeft = Math.max(0, Math.min(newLeft, maxX));
      newTop = Math.max(0, Math.min(newTop, maxY));
      
      // Update the position immediately
      microscope.style.left = `${newLeft}px`;
      microscope.style.top = `${newTop}px`;
      
      // Update magnification controls position during drag
      this.positionMagnificationControls();
      
      // Reveal new cells based on microscope position (like real microscope)
      this.revealCellsAtPosition(newLeft, newTop);
    });

    // Stop dragging when mouse button is released
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        microscope.style.cursor = 'grab';
      }
    });

    // Touch support for mobile devices
    microscope.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const touch = e.touches[0];
      startMouseX = touch.clientX;
      startMouseY = touch.clientY;
      startMicroscopeX = parseFloat(microscope.style.left) || 0;
      startMicroscopeY = parseFloat(microscope.style.top) || 0;
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startMouseX;
      const deltaY = touch.clientY - startMouseY;
      
      let newLeft = startMicroscopeX + deltaX;
      let newTop = startMicroscopeY + deltaY;
      
      const parentRect = microscope.parentElement.getBoundingClientRect();
      const maxX = parentRect.width - microscope.offsetWidth;
      const maxY = parentRect.height - microscope.offsetHeight;
      
      newLeft = Math.max(0, Math.min(newLeft, maxX));
      newTop = Math.max(0, Math.min(newTop, maxY));
      
      microscope.style.left = `${newLeft}px`;
      microscope.style.top = `${newTop}px`;
      
      // Update magnification controls position during touch drag
      this.positionMagnificationControls();
      
      // Reveal new cells based on microscope position
      this.revealCellsAtPosition(newLeft, newTop);
    });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });
  }
  
  // Function to make the microscope field view resizable
  makeMicroscopeResizable(microscope) {
    const resizeHandle = document.getElementById('resizeHandle');
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startLeft = 0;
    let startTop = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = microscope.offsetWidth;
      startHeight = microscope.offsetHeight;
      startLeft = microscope.offsetLeft;
      startTop = microscope.offsetTop;
      microscope.style.cursor = 'nwse-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth + deltaX;
      let newHeight = startHeight + deltaY;
      
      // Apply constraints
      newWidth = Math.max(150, Math.min(400, newWidth));
      newHeight = Math.max(150, Math.min(400, newHeight));
      
      // Keep circular shape (use average of width and height)
      const size = Math.round((newWidth + newHeight) / 2);
      
      // Calculate position adjustment to keep top-left corner pivoted
      const sizeChange = size - startWidth;
      const newLeft = startLeft - (sizeChange / 2);
      const newTop = startTop - (sizeChange / 2);
      
      // Apply new size and position
      microscope.style.width = `${size}px`;
      microscope.style.height = `${size}px`;
      microscope.style.left = `${newLeft}px`;
      microscope.style.top = `${newTop}px`;
      
      // Update magnification controls position during drag
      this.positionMagnificationControls();
      
      // Adjust microbes in real-time during resize
      this.adjustMicrobesForSize();
      
      console.log('Resizing microscope to:', size, 'position:', { newLeft, newTop });
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        microscope.style.cursor = 'grab';
        
        console.log('Finished resizing');
      }
    });
  }
  
  adjustMicrobesForSize() {
    const microscopeOverlay = document.getElementById('microscopeOverlay');
    const currentSize = microscopeOverlay.offsetWidth;
    const baseSize = 200; // Original size
    const sizeRatio = currentSize / baseSize;
    
    // Calculate how many microbes should be visible based on size
    const maxMicrobes = Math.round(200 * sizeRatio); // Use 200 as base, not 50
    const currentMicrobes = this.microbes.length;
    
    if (maxMicrobes > currentMicrobes) {
      // Add more microbes for larger viewing area
      for (let i = currentMicrobes; i < maxMicrobes; i++) {
        this.createMicrobe();
      }
    } else if (maxMicrobes < currentMicrobes) {
      // Remove excess microbes for smaller viewing area
      for (let i = currentMicrobes - 1; i >= maxMicrobes; i--) {
        if (this.microbes[i] && this.microbes[i].element) {
          this.microbes[i].element.remove();
          this.microbes.splice(i, 1);
        }
      }
    }
    
    // Update visibility based on current microscope position
    const microscopeX = parseFloat(microscopeOverlay.style.left) || 0;
    const microscopeY = parseFloat(microscopeOverlay.style.top) || 0;
    this.revealCellsAtPosition(microscopeX, microscopeY);
  }
  
  // Function to create a new microbe and position it in the ecosystem
  createMicrobe() {
    const mainCanvas = document.getElementById('mainCanvas');
    const microbe = document.createElement('div');
    microbe.className = 'microbe';
    
    // Randomly assign a type (aerobic/anaerobic) based on ecosystem data
    const isAerobic = Math.random() < (this.ecosystemData.aerobicProportion / 100);
    microbe.classList.add(isAerobic ? 'microbe-aerobic' : 'microbe-anaerobic');

    // Use current magnification for size calculation
    const scaleFactor = this.magnification / 100;
    const baseSize = 4;
    const size = baseSize * scaleFactor;
    microbe.style.width = `${size}px`;
    microbe.style.height = `${size}px`;
    
    // Store base data for consistent scaling
    microbe.dataset.baseSize = baseSize;

    // Position cell randomly in the entire ecosystem (main canvas)
    const canvasRect = mainCanvas.getBoundingClientRect();
    const ecosystemWidth = canvasRect.width;
    const ecosystemHeight = canvasRect.height;
    
    const posX = Math.random() * (ecosystemWidth - size);
    const posY = Math.random() * (ecosystemHeight - size);
    
    // Store absolute ecosystem position
    microbe.style.position = 'absolute';
    microbe.style.left = `${posX}px`;
    microbe.style.top = `${posY}px`;
    microbe.style.display = 'none'; // Initially hidden until microscope reveals it

    // Add movement behavior to the microbe (swimming/floating)
    microbe.classList.add(Math.random() > 0.5 ? 'floating-microbe' : 'swimming-microbe');
    
    // Adjust movement speed based on magnification
    const baseSpeed = 3;
    const newSpeed = baseSpeed / scaleFactor;
    microbe.style.animationDuration = `${newSpeed}s`;
    
    // Append to main canvas (ecosystem), not microscope
    mainCanvas.appendChild(microbe);
    this.microbes.push({
      element: microbe,
      type: isAerobic ? 'aerobic' : 'anaerobic',
      x: posX,
      y: posY,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      baseSize: baseSize,
      currentSize: size
    });
    
    console.log(`Created microbe ${this.microbes.length} at position (${posX.toFixed(1)}, ${posY.toFixed(1)})`);
  }
  
  // Update microbes based on oxygen levels and random movement
  updateMicrobes() {
    const activity = this.ecosystemData.dissolvedOxygen / 10;
    
    // Update each microbe's position based on its velocity
    this.microbes.forEach(microbe => {
      microbe.x += microbe.vx * activity;
      microbe.y += microbe.vy * activity;

      // Bounce off ecosystem boundaries (main canvas edges)
      const mainCanvas = document.getElementById('mainCanvas');
      const canvasRect = mainCanvas.getBoundingClientRect();
      const maxX = canvasRect.width - parseFloat(microbe.element.style.width || 4);
      const maxY = canvasRect.height - parseFloat(microbe.element.style.height || 4);
      
      if (microbe.x <= 0 || microbe.x >= maxX) microbe.vx *= -1;
      if (microbe.y <= 0 || microbe.y >= maxY) microbe.vy *= -1;

      // Ensure microbe stays within ecosystem bounds
      microbe.x = Math.max(0, Math.min(maxX, microbe.x));
      microbe.y = Math.max(0, Math.min(maxY, microbe.y));

      // Adjust opacity based on activity level
      microbe.element.style.opacity = 0.3 + activity * 0.7;
    });
  }
  
  // Generate AI-powered ecological description - DISABLED
  generateEcologicalText(currentValues) {
    console.log('generateEcologicalText called with values:', currentValues);
    
    // Return static text with original numbered format instead of making API calls
    const season = currentValues.season;
    const coverage = currentValues.chestnutCoverage;
    const depth = currentValues.waterDepth;
    const nutrients = currentValues.nutrientLevel;
    const movement = currentValues.waterMovement;
    
    let seasonalDescription = '';
    let seasonalEffects = '';
    
    switch(season) {
      case 'spring':
        seasonalDescription = 'Spring awakening with early water chestnut growth';
        seasonalEffects = `Early growth is increasing photosynthesis while beginning nutrient uptake. Light green rosettes are establishing with ${coverage}% surface coverage.`;
        break;
        
      case 'summer':
        seasonalDescription = 'Summer peak growth with extensive water chestnut mats';
        seasonalEffects = `Dense coverage creates severe shading, reducing water clarity and dissolved oxygen. High stratification risk with current conditions.`;
        break;
        
      case 'fall':
        seasonalDescription = 'Fall senescence with seed production and decomposition';
        seasonalEffects = `Mature plants are producing seeds while beginning senescence. Decomposition is increasing nutrient recycling and oxygen demand in the sediment.`;
        break;
        
      case 'winter':
        seasonalDescription = 'Winter dormancy with reduced metabolic activity';
        seasonalEffects = `Dormant water chestnut remnants provide limited habitat. Cold temperatures slow microbial activity and maintain higher oxygen levels.`;
        break;
    }
    
    return `
      <div class="education-content">
        <div class="education-title">Current Ecological State</div>
        <div style="white-space: pre-line;">
1. <span style="color: darkblue; font-weight: bold;">Water Depth: ${depth}m</span><br>
   Water depth directly controls light penetration and temperature stratification. At ${depth}m, light availability decreases significantly with depth, affecting photosynthesis and creating thermal layers that influence oxygen distribution and microbial habitat conditions.

2. <span style="color: darkblue; font-weight: bold;">Chestnut Coverage: ${coverage}%</span><br>
   Surface coverage determines the extent of light blocking and habitat modification. ${coverage}% coverage creates substantial shading that reduces water clarity and dissolved oxygen while providing extensive floating habitat for invertebrates and affecting nutrient cycling patterns.

3. <span style="color: darkblue; font-weight: bold;">Nutrient Level: ${nutrients}/10</span><br>
   Nutrient concentration drives primary productivity and microbial activity. A level of ${nutrients}/10 indicates ${nutrients <= 3 ? 'oligotrophic conditions with limited productivity' : nutrients <= 6 ? 'mesotrophic conditions with moderate productivity' : 'eutrophic conditions with high productivity potential'}, significantly influencing algal growth and decomposition rates.

4. <span style="color: darkblue; font-weight: bold;">Water Movement: ${movement}/10</span><br>
   Water movement controls oxygen exchange and mixing dynamics. The current ${movement}/10 level represents ${movement <= 3 ? 'calm conditions with limited mixing and potential stratification' : movement <= 6 ? 'moderate movement providing adequate oxygen exchange' : 'rapid movement enhancing mixing and oxygen distribution'}, directly affecting sediment oxygen levels and nutrient transport.

5. <span style="color: darkblue; font-weight: bold;">Season: ${season}</span><br>
   Seasonal cycles drive biological activity and ecosystem processes. ${season} conditions dictate metabolic rates, growth patterns, and community structure, with ${season === 'spring' ? 'increasing productivity and growth initiation' : season === 'summer' ? 'peak photosynthesis and high metabolic demand' : season === 'fall' ? 'senescence and decomposition dominance' : 'dormancy and reduced activity'} characterizing the current ecosystem state.

6. <strong>Comprehensive Analysis:</strong><br>
   The current ecosystem state reflects the complex interplay between physical and biological factors. ${seasonalDescription} The combination of ${depth}m depth, ${coverage}% chestnut coverage, nutrient level ${nutrients}/10, and water movement ${movement}/10 creates specific ecological conditions that determine water quality, habitat availability, and ecosystem functioning. These parameters collectively influence light penetration, oxygen dynamics, nutrient cycling, and biological productivity, resulting in the observed ${seasonalEffects.toLowerCase()} The system's response to these conditions demonstrates the delicate balance between physical forcing and biological processes characteristic of freshwater ecosystems with invasive macrophyte dominance.
        </div>
      </div>
    `;
  }
  
  startAnimation() {
    setInterval(() => {
      this.updateMicrobes();
      this.updateVisibleCellPositions();
    }, 50);
  }
  
  // Update positions of visible cells only (more efficient)
  updateVisibleCellPositions() {
    const microscopeOverlay = document.getElementById('microscopeOverlay');
    const microscopeX = parseFloat(microscopeOverlay.style.left) || 0;
    const microscopeY = parseFloat(microscopeOverlay.style.top) || 0;
    const margin = 10;
    
    // Only update cells that are currently visible
    this.microbes.forEach(microbe => {
      if (microbe.element && microbe.element.style.display === 'block') {
        // Update position relative to microscope
        const relX = microbe.x - microscopeX;
        const relY = microbe.y - microscopeY;
        
        // Check if still within bounds
        const microscopeSize = microscopeOverlay.offsetWidth;
        const availableSize = microscopeSize - (margin * 2);
        const isInBounds = (
          relX >= margin &&
          relY >= margin &&
          relX <= availableSize &&
          relY <= availableSize
        );
        
        if (isInBounds) {
          // Update position with smooth transition
          microbe.element.style.transition = 'left 0.05s linear, top 0.05s linear';
          microbe.element.style.left = `${relX}px`;
          microbe.element.style.top = `${relY}px`;
        } else {
          // Hide if out of bounds
          microbe.element.style.display = 'none';
        }
      }
    });
  }
  
  revealCellsAtPosition(microscopeX, microscopeY) {
    const microscopeOverlay = document.getElementById('microscopeOverlay');
    const microscopeSize = microscopeOverlay.offsetWidth;
    const radius = microscopeSize / 2; // Circular radius
    const centerX = microscopeX + radius;
    const centerY = microscopeY + radius;
    
    let visibleCount = 0;
    
    // Calculate which cells should be visible based on microscope position
    this.microbes.forEach(microbe => {
      if (microbe.element) {
        // Check if cell is within circular microscope view using distance formula
        const distance = Math.sqrt(
          Math.pow(microbe.x - centerX, 2) + 
          Math.pow(microbe.y - centerY, 2)
        );
        
        const isInView = distance <= radius;
        
        if (isInView) {
          // Move cell to microscope overlay if not already there
          if (microbe.element.parentElement !== microscopeOverlay) {
            microscopeOverlay.appendChild(microbe.element);
          }
          
          microbe.element.style.display = 'block';
          visibleCount++;
        } else {
          // Hide cell when microscope moves away, but keep it in microscope overlay
          microbe.element.style.display = 'none';
        }
      }
    });
  }
}

// Initialize simulation when page loads
document.addEventListener('DOMContentLoaded', () => {
  new TrapaNatansSimulation();
});