from flask import Flask, render_template_string, jsonify
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template_string('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trapa Natans Ecological Simulation</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .water-gradient {
            background: linear-gradient(to bottom, #67e8f9, #0891b2, #0e7490);
        }
        .chestnut-layer {
            background: linear-gradient(to bottom, #15803d, #166534, #14532d);
            transition: all 1s ease-in-out;
        }
        .microbe {
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 50%;
            animation: float 3s infinite ease-in-out;
        }
        @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(10px, -5px); }
        }
        .indicator-bar {
            transition: width 0.5s ease-in-out;
        }
    </style>
</head>
<body class="bg-gradient-to-b from-sky-100 to-blue-200 min-h-screen">
    <h1 class="text-3xl font-bold text-center py-4 text-blue-900">Trapa Natans Ecological Impact Simulation</h1>
    
    <div class="container mx-auto p-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Controls Panel -->
            <div class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-4">
                <h2 class="text-xl font-semibold mb-4 text-blue-800">Environmental Controls</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-blue-700 mb-2">
                            Water Depth: <span id="depthValue">2.0m</span>
                        </label>
                        <input type="range" id="waterDepth" min="0.5" max="5" step="0.1" value="2" 
                               class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-blue-700 mb-2">
                            Water Chestnut Coverage: <span id="coverageValue">0%</span>
                        </label>
                        <input type="range" id="chestnutCoverage" min="0" max="100" step="1" value="0" 
                               class="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-blue-700 mb-2">
                            Nutrient Level: <span id="nutrientValue">Medium</span>
                        </label>
                        <input type="range" id="nutrientLevel" min="1" max="10" step="1" value="5" 
                               class="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-blue-700 mb-2">
                            Water Movement: <span id="movementValue">Moderate</span>
                        </label>
                        <input type="range" id="waterMovement" min="1" max="10" step="1" value="5" 
                               class="w-full h-2 bg-cyan-200 rounded-lg appearance-none cursor-pointer">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-blue-700 mb-2">Season</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="season-btn px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition" data-season="spring">Spring</button>
                            <button class="season-btn px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition" data-season="summer">Summer</button>
                            <button class="season-btn px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition" data-season="fall">Fall</button>
                            <button class="season-btn px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" data-season="winter">Winter</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Visual Simulation -->
            <div class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-4">
                <h2 class="text-xl font-semibold mb-4 text-blue-800">Aquatic Environment</h2>
                <div id="underwaterView" class="relative h-80 water-gradient rounded-lg overflow-hidden">
                    <div id="chestnutLayer" class="chestnut-layer absolute top-0 left-0 right-0 h-0"></div>
                    <div id="waterColumn" class="absolute inset-0">
                        <div id="bottomVegetation" class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-800 to-green-600 opacity-60"></div>
                    </div>
                    <div id="microscopeView" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full border-4 border-white/40 backdrop-blur-sm">
                        <div id="microbes" class="w-full h-full rounded-full relative overflow-hidden"></div>
                    </div>
                </div>
            </div>
            
            <!-- Ecological Indicators -->
            <div class="bg-white/90 backdrop-blur rounded-lg shadow-lg p-4">
                <h2 class="text-xl font-semibold mb-4 text-blue-800">Ecological Indicators</h2>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Water Clarity:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="clarityBar" class="h-full bg-blue-500 indicator-bar" style="width: 80%"></div>
                            </div>
                            <span id="clarityValue" class="ml-2 text-sm font-medium">80%</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Sediment Oxygen:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="sedimentBar" class="h-full bg-green-500 indicator-bar" style="width: 70%"></div>
                            </div>
                            <span id="sedimentValue" class="ml-2 text-sm font-medium">70%</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Stratification Risk:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="stratificationBar" class="h-full bg-red-500 indicator-bar" style="width: 20%"></div>
                            </div>
                            <span id="stratificationValue" class="ml-2 text-sm font-medium">20%</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Dissolved Oxygen:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="oxygenBar" class="h-full bg-cyan-500 indicator-bar" style="width: 85%"></div>
                            </div>
                            <span id="oxygenValue" class="ml-2 text-sm font-medium">8.5 mg/L</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Nutrient Availability:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="nutrientBar" class="h-full bg-yellow-500 indicator-bar" style="width: 50%"></div>
                            </div>
                            <span id="nutrientAvailValue" class="ml-2 text-sm font-medium">5</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Decomposition Rate:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="decompBar" class="h-full bg-orange-500 indicator-bar" style="width: 30%"></div>
                            </div>
                            <span id="decompValue" class="ml-2 text-sm font-medium">3</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Microbial Biomass:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="biomassBar" class="h-full bg-purple-500 indicator-bar" style="width: 60%"></div>
                            </div>
                            <span id="biomassValue" class="ml-2 text-sm font-medium">60%</span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-blue-700">Microbial Diversity:</span>
                        <div class="flex items-center">
                            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div id="diversityBar" class="h-full bg-pink-500 indicator-bar" style="width: 75%"></div>
                            </div>
                            <span id="diversityValue" class="ml-2 text-sm font-medium">75%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Educational Text Panel -->
        <div class="mt-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-4">
            <h2 class="text-xl font-semibold mb-2 text-blue-800">Ecological Processes</h2>
            <div id="educationalText" class="text-sm text-blue-700 leading-relaxed">
                <p>Welcome to the Trapa natans ecological simulation. Adjust the environmental controls to see how water chestnut coverage affects freshwater microbial communities and water quality.</p>
                <p class="mt-2">Water chestnut forms dense floating mats that reduce light penetration and limit gas exchange between water and atmosphere. This can lead to decreased dissolved oxygen levels and changes in microbial community composition.</p>
            </div>
        </div>
    </div>

    <script>
        class TrapaNatansSimulation {
            constructor() {
                this.waterDepth = 2.0;
                this.chestnutCoverage = 0;
                this.nutrientLevel = 5;
                this.waterMovement = 5;
                this.season = "summer";
                
                this.ecologicalIndicators = {
                    waterClarity: 80,
                    sedimentOxygen: 70,
                    stratificationRisk: 20,
                    dissolvedOxygen: 8.5,
                    nutrientAvailability: 5,
                    decompositionRate: 3,
                    microbialBiomass: 60,
                    microbialDiversity: 75
                };
                
                this.init();
            }
            
            init() {
                this.attachEventListeners();
                this.updateSimulation();
            }
            
            attachEventListeners() {
                document.getElementById("waterDepth").addEventListener("input", (e) => {
                    this.waterDepth = parseFloat(e.target.value);
                    document.getElementById("depthValue").textContent = `${this.waterDepth.toFixed(1)}m`;
                    this.updateSimulation();
                });
                
                document.getElementById("chestnutCoverage").addEventListener("input", (e) => {
                    this.chestnutCoverage = parseInt(e.target.value);
                    document.getElementById("coverageValue").textContent = `${this.chestnutCoverage}%`;
                    this.updateSimulation();
                });
                
                document.getElementById("nutrientLevel").addEventListener("input", (e) => {
                    this.nutrientLevel = parseInt(e.target.value);
                    const labels = ["Very Low", "Low", "Low-Medium", "Medium", "Medium", "Medium-High", "High", "High", "Very High", "Very High"];
                    document.getElementById("nutrientValue").textContent = labels[this.nutrientLevel - 1];
                    this.updateSimulation();
                });
                
                document.getElementById("waterMovement").addEventListener("input", (e) => {
                    this.waterMovement = parseInt(e.target.value);
                    const labels = ["Still", "Very Still", "Slow", "Slow", "Moderate", "Moderate", "Moderate", "Flowing", "Flowing", "Fast"];
                    document.getElementById("movementValue").textContent = labels[this.waterMovement - 1];
                    this.updateSimulation();
                });
                
                document.querySelectorAll(".season-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        document.querySelectorAll(".season-btn").forEach(b => b.classList.remove("ring-2", "ring-white"));
                        btn.classList.add("ring-2", "ring-white");
                        this.season = btn.dataset.season;
                        this.updateSimulation();
                    });
                });
                
                document.querySelector('[data-season="summer"]').classList.add("ring-2", "ring-white");
            }
            
            updateSimulation() {
                this.calculateEcologicalIndicators();
                this.updateVisuals();
                this.updateIndicators();
                this.updateEducationalText();
                this.updateMicrobes();
            }
            
            calculateEcologicalIndicators() {
                let clarity = 80;
                let sedimentO2 = 70;
                let stratification = 20;
                let dissolvedO2 = 8.5;
                let nutrientAvail = this.nutrientLevel;
                let decomp = 3;
                let biomass = 60;
                let diversity = 75;
                
                // Water chestnut coverage effects
                clarity -= this.chestnutCoverage * 0.6;
                dissolvedO2 -= this.chestnutCoverage * 0.05;
                sedimentO2 -= this.chestnutCoverage * 0.4;
                stratification += this.chestnutCoverage * 0.3;
                
                // Season effects
                const seasonEffects = {
                    spring: { temp: 15, light: 70, decomp: 0.8 },
                    summer: { temp: 25, light: 100, decomp: 1.2 },
                    fall: { temp: 15, light: 50, decomp: 1.5 },
                    winter: { temp: 5, light: 30, decomp: 0.5 }
                };
                
                const currentSeason = seasonEffects[this.season];
                dissolvedO2 -= (currentSeason.temp - 15) * 0.1;
                decomp *= currentSeason.decomp;
                
                // Water depth effects
                clarity -= (this.waterDepth - 2) * 5;
                stratification += (this.waterDepth - 2) * 10;
                
                // Water movement effects
                dissolvedO2 += this.waterMovement * 0.2;
                stratification -= this.waterMovement * 5;
                
                // Nutrient effects
                biomass += (this.nutrientLevel - 5) * 5;
                decomp += (this.nutrientLevel - 5) * 0.5;
                
                // Fall die-off effect
                if (this.season === "fall" && this.chestnutCoverage > 50) {
                    nutrientAvail += this.chestnutCoverage * 0.1;
                    decomp += this.chestnutCoverage * 0.05;
                }
                
                // Microbial community shifts
                if (dissolvedO2 < 5) {
                    diversity -= (5 - dissolvedO2) * 5;
                    biomass += (5 - dissolvedO2) * 3;
                }
                
                this.ecologicalIndicators = {
                    waterClarity: Math.max(0, Math.min(100, clarity)),
                    sedimentOxygen: Math.max(0, Math.min(100, sedimentO2)),
                    stratificationRisk: Math.max(0, Math.min(100, stratification)),
                    dissolvedOxygen: Math.max(0, Math.min(15, dissolvedO2)),
                    nutrientAvailability: Math.max(0, Math.min(10, nutrientAvail)),
                    decompositionRate: Math.max(0, Math.min(10, decomp)),
                    microbialBiomass: Math.max(0, Math.min(100, biomass)),
                    microbialDiversity: Math.max(0, Math.min(100, diversity))
                };
            }
            
            updateVisuals() {
                const chestnutLayer = document.getElementById("chestnutLayer");
                const layerHeight = (this.chestnutCoverage / 100) * 40;
                chestnutLayer.style.height = `${layerHeight}px`;
                
                const waterColumn = document.getElementById("waterColumn");
                const depthOpacity = Math.max(0.3, 1 - (this.waterDepth - 0.5) / 4.5);
                waterColumn.style.opacity = depthOpacity;
                
                const clarity = this.ecologicalIndicators.waterClarity;
                const nutrients = this.nutrientLevel;
                const blueIntensity = Math.max(100, 255 - (100 - clarity) * 2 - nutrients * 5);
                const greenIntensity = Math.max(50, 200 - (100 - clarity) * 1.5 - nutrients * 3);
                
                waterColumn.style.background = `linear-gradient(to bottom, 
                    rgb(${blueIntensity-50}, ${greenIntensity}, ${blueIntensity}), 
                    rgb(${blueIntensity-100}, ${greenIntensity-50}, ${blueIntensity}))`;
                
                const bottomVeg = document.getElementById("bottomVegetation");
                const vegDensity = Math.max(0, clarity * 0.8 + nutrients * 2 - this.chestnutCoverage * 0.5);
                bottomVeg.style.opacity = Math.min(0.8, vegDensity / 100);
                bottomVeg.style.height = `${20 + nutrients * 3}px`;
            }
            
            updateIndicators() {
                const indicators = [
                    { id: "clarity", value: this.ecologicalIndicators.waterClarity, suffix: "%" },
                    { id: "sediment", value: this.ecologicalIndicators.sedimentOxygen, suffix: "%" },
                    { id: "stratification", value: this.ecologicalIndicators.stratificationRisk, suffix: "%" },
                    { id: "oxygen", value: this.ecologicalIndicators.dissolvedOxygen, suffix: " mg/L", scale: 6.67 },
                    { id: "nutrient", value: this.ecologicalIndicators.nutrientAvailability, suffix: "" },
                    { id: "decomp", value: this.ecologicalIndicators.decompositionRate, suffix: "" },
                    { id: "biomass", value: this.ecologicalIndicators.microbialBiomass, suffix: "%" },
                    { id: "diversity", value: this.ecologicalIndicators.microbialDiversity, suffix: "%" }
                ];
                
                indicators.forEach(indicator => {
                    const percentage = indicator.scale ? indicator.value * indicator.scale : indicator.value;
                    document.getElementById(`${indicator.id}Bar`).style.width = `${percentage}%`;
                    document.getElementById(`${indicator.id}Value`).textContent = `${indicator.value.toFixed(1)}${indicator.suffix}`;
                });
            }
            
            updateEducationalText() {
                const text = document.getElementById("educationalText");
                let explanation = "";
                
                if (this.chestnutCoverage > 70) {
                    explanation = `<p class="font-semibold">High Water Chestnut Coverage (${this.chestnutCoverage}%)</p>
                        <p>The dense floating mat severely limits light penetration and gas exchange. Dissolved oxygen has dropped to ${this.ecologicalIndicators.dissolvedOxygen.toFixed(1)} mg/L, creating stressful conditions for many aquatic organisms.</p>`;
                } else if (this.chestnutCoverage > 30) {
                    explanation = `<p class="font-semibold">Moderate Water Chestnut Coverage (${this.chestnutCoverage}%)</p>
                        <p>The floating vegetation is beginning to impact water quality. Light penetration is reduced to ${this.ecologicalIndicators.waterClarity.toFixed(0)}%, and dissolved oxygen levels are declining.</p>`;
                } else {
                    explanation = `<p class="font-semibold">Low Water Chestnut Coverage (${this.chestnutCoverage}%)</p>
                        <p>With minimal surface coverage, the aquatic system maintains good water clarity (${this.ecologicalIndicators.waterClarity.toFixed(0)}%) and healthy dissolved oxygen levels (${this.ecologicalIndicators.dissolvedOxygen.toFixed(1)} mg/L).</p>`;
                }
                
                if (this.season === "fall" && this.chestnutCoverage > 50) {
                    explanation += `<p class="mt-2"><strong>Fall Die-off:</strong> As water chestnut plants decompose, nutrient availability has increased to ${this.ecologicalIndicators.nutrientAvailability.toFixed(1)}, and decomposition rates are elevated at ${this.ecologicalIndicators.decompositionRate.toFixed(1)}.</p>`;
                }
                
                if (this.ecologicalIndicators.dissolvedOxygen < 5) {
                    explanation += `<p class="mt-2"><strong>Low Oxygen Warning:</strong> Dissolved oxygen levels are critically low. Aerobic microbes are declining while anaerobic microbes are increasing, reducing microbial diversity to ${this.ecologicalIndicators.microbialDiversity.toFixed(0)}%.</p>`;
                }
                
                if (this.ecologicalIndicators.stratificationRisk > 60) {
                    explanation += `<p class="mt-2"><strong>High Stratification Risk:</strong> The water column is likely stratified, preventing mixing and oxygen exchange between layers.</p>`;
                }
                
                text.innerHTML = explanation;
            }
            
            updateMicrobes() {
                const microbesContainer = document.getElementById("microbes");
                microbesContainer.innerHTML = "";
                
                const biomass = this.ecologicalIndicators.microbialBiomass;
                const oxygen = this.ecologicalIndicators.dissolvedOxygen;
                
                const numMicrobes = Math.floor(biomass / 5);
                
                for (let i = 0; i < numMicrobes; i++) {
                    const microbe = document.createElement("div");
                    microbe.className = "microbe";
                    
                    if (oxygen > 6) {
                        microbe.classList.add("bg-blue-400");
                    } else if (oxygen > 3) {
                        microbe.classList.add("bg-yellow-400");
                    } else {
                        microbe.classList.add("bg-red-400");
                    }
                    
                    microbe.style.left = `${Math.random() * 100}%`;
                    microbe.style.top = `${Math.random() * 100}%`;
                    microbe.style.animationDelay = `${Math.random() * 2}s`;
                    
                    microbesContainer.appendChild(microbe);
                }
            }
        }
        
        document.addEventListener("DOMContentLoaded", () => {
            new TrapaNatansSimulation();
        });
    </script>
</body>
</html>
''')

@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    # Add backend calculation if needed
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
