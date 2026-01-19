import { Simulation } from './core/Simulation';
import { UIManager } from './ui/UIManager';
import { getDefaultConfig } from './config/defaults';

const canvas = document.getElementById('simulation-canvas') as HTMLCanvasElement;
const config = getDefaultConfig();

const simulation = new Simulation(config);
const ui = new UIManager(canvas, simulation);

simulation.start();
ui.init();

// Make simulation accessible for debugging
(window as unknown as { simulation: Simulation }).simulation = simulation;
