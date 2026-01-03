# Trapa Natans Simulation

An interactive ecological simulation of the Trapa Natans (water chestnut) ecosystem, featuring dynamic vegetation, seasonal changes, and environmental controls.

## Features

### 🌱 **Dynamic Vegetation System**
- **Realistic grass stalks** with curved, swaying movement
- **Water depth response** - taller vegetation in shallow water, shorter in deep water
- **Nutrient level effects** - higher nutrients create denser, healthier vegetation
- **Natural animations** - slow, curved movement with stationary bottoms
- **Water flow control** - higher flow creates more dramatic swaying

### 🌰 **Winter Seed Dispersal**
- **Seasonal seed generation** - seeds appear during winter
- **Water flow-based fading** - stronger currents wash seeds away faster
- **Natural dispersal patterns** - seeds gradually fade and disappear
- **Debug console logging** - track seed behavior in real-time

### 🍂 **Seasonal Ecosystem**
- **Four distinct seasons** - Spring, Summer, Fall, Winter
- **Seasonal vegetation changes** - growth patterns and appearance
- **Environmental responses** - water clarity, oxygen levels, and nutrients
- **Dynamic metrics** - real-time ecosystem health indicators

### 💧 **Interactive Controls**
- **Water Depth** (1-10): Controls vegetation height and underwater pressure
- **Nutrient Level** (1-10): Affects vegetation density and health
- **Chestnut Coverage** (0-100%): Determines pad population
- **Water Movement** (1-10): Controls animation speed and seed dispersal
- **Season Selection**: Switch between Spring, Summer, Fall, Winter

### 🔬 **Microscope Feature**
- **100x magnification** - View microbial life
- **Draggable microscope** - Explore different areas
- **Microbe visibility** - Circular detection area
- **Real-time positioning** - Updates as you move the microscope

### 📊 **Ecological Metrics**
- **Water Clarity** - Visual water quality indicator
- **Dissolved Oxygen** - Aquatic life support
- **Sediment Oxygen** - Bottom layer oxygen levels
- **Stratification Risk** - Water layer separation danger
- **Nutrient Availability** - Plant growth potential
- **Decomposition Rate** - Organic matter breakdown
- **Microbial Biomass** - Bacterial population density
- **Microbial Diversity** - Species variety index
- **Aerobic/Anaerobic Balance** - Oxygen-dependent bacteria ratio

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation
1. Clone or download the project files
2. Open `index.html` in your web browser
3. Or run a local server:
   ```bash
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

### Usage
1. **Adjust Controls**: Use the sliders to modify environmental conditions
2. **Change Seasons**: Click season buttons to see different ecosystem states
3. **Observe Changes**: Watch vegetation, pads, and metrics respond in real-time
4. **Explore Microbes**: Drag the microscope to view microbial life
5. **Monitor Console**: Open browser console for debug information

## Technical Details

### Vegetation Animation System
- **Curved movement**: Multi-step keyframes for natural S-curve motion
- **Bottom-pinned**: Transform origin set to bottom center for realistic swaying
- **Flow-responsive**: Animation speed and range scale with water movement
- **Segmented construction**: Multiple segments create continuous grass stalks

### Seed Dispersal Algorithm
- **Winter-only activation**: Seeds only appear and fade during winter
- **Flow-based timing**: 45s to 4.5s fade duration based on water flow
- **Individual variation**: Each seed has unique timing and delay
- **Complete removal**: Seeds disappear after fading (no infinite loops)

### Seasonal Ecosystem Model
- **Dynamic metrics**: Calculated based on environmental conditions
- **Realistic responses**: Water depth, nutrients, and coverage affect ecosystem
- **Seasonal variations**: Different baseline values for each season
- **Interconnected systems**: Changes cascade through multiple metrics

## File Structure
```
├── index.html          # Main HTML structure
├── simulation.js       # Core simulation logic and animations
├── styles.css          # Styling and visual effects
├── app.py             # Flask backend (if using server)
└── README.md          # This documentation
```

## Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support

## Performance Notes
- **Optimized animations**: Uses requestAnimationFrame for smooth motion
- **Efficient DOM updates**: Only regenerates when parameters change
- **Debounced calculations**: Prevents excessive computation during rapid changes
- **Memory management**: Cleans up old animation keyframes

## Development
- **Modular design**: Separate methods for each system
- **Debug logging**: Comprehensive console output for troubleshooting
- **Extensible**: Easy to add new seasons, metrics, or features
- **Commented code**: Clear documentation throughout

## License
This project is open source and available under the MIT License.

## Contributing
Feel free to submit issues, feature requests, or pull requests to improve the simulation.

---

*An educational tool for understanding aquatic ecosystem dynamics and the Trapa Natans species.*
