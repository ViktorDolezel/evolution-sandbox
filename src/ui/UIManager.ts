import type { Simulation } from '../core/Simulation';
import { createCamera, type Camera } from '../rendering/Camera';
import { createRenderer, type Renderer } from '../rendering/Renderer';
import { createSelectionManager, type SelectionManager } from './SelectionManager';
import { createInputHandler, type InputHandler } from './InputHandler';
import { createInfoPanel, type InfoPanel } from './InfoPanel';
import { createControlPanel, type ControlPanel } from './ControlPanel';
import { createSidebar, type Sidebar } from './Sidebar';
import { createPopulationGraph, type PopulationGraph } from './PopulationGraph';
import { createHelpDialog, type HelpDialog } from './HelpDialog';
import { createPopulationHistory, type PopulationHistory } from '../data/PopulationHistory';
import { createActionHistory, type ActionHistory } from '../data/ActionHistory';

export class UIManager {
  private simulation: Simulation;
  private canvas: HTMLCanvasElement;

  private camera: Camera;
  private renderer: Renderer;
  private selectionManager: SelectionManager;
  private inputHandler: InputHandler;
  private infoPanel: InfoPanel;
  private controlPanel: ControlPanel;
  private sidebar: Sidebar;
  private populationGraph: PopulationGraph;
  private populationHistory: PopulationHistory;
  private actionHistory: ActionHistory;
  private helpDialog: HelpDialog;

  private animationFrameId: number | null = null;
  private isInitialized = false;

  constructor(canvas: HTMLCanvasElement, simulation: Simulation) {
    this.canvas = canvas;
    this.simulation = simulation;

    const config = simulation.config;

    // Initialize canvas size
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    // Create camera
    this.camera = createCamera(
      this.canvas.width,
      this.canvas.height,
      config.ui.MIN_ZOOM,
      config.ui.MAX_ZOOM
    );

    // Center camera on world
    this.camera.fitToWorld(config.world.WORLD_WIDTH, config.world.WORLD_HEIGHT);

    // Create selection manager
    this.selectionManager = createSelectionManager();

    // Create renderer
    this.renderer = createRenderer(this.canvas, this.camera, this.selectionManager, config);

    // Create population history
    this.populationHistory = createPopulationHistory(1000);

    // Create action history
    this.actionHistory = createActionHistory(config.ui.MAX_ACTION_LOG_HISTORY);
    this.simulation.setActionHistory(this.actionHistory);

    // Get UI containers
    const controlPanelContainer = document.getElementById('control-panel');
    const sidebarContainer = document.getElementById('sidebar');
    const graphPanelContainer = document.getElementById('graph-panel');
    const infoPanelContainer = document.getElementById('info-panel');

    if (!controlPanelContainer || !sidebarContainer || !graphPanelContainer || !infoPanelContainer) {
      throw new Error('UI containers not found in DOM');
    }

    // Create UI components
    this.infoPanel = createInfoPanel(infoPanelContainer);
    this.controlPanel = createControlPanel(controlPanelContainer, simulation);
    this.sidebar = createSidebar(sidebarContainer, this.selectionManager, config);
    this.populationGraph = createPopulationGraph(graphPanelContainer, this.populationHistory);

    // Configure sidebar with action history and parent click handler
    this.sidebar.setActionHistory(this.actionHistory);
    this.sidebar.setCallbacks({
      onParentClick: (parentId) => {
        const animal = this.simulation.world.entityManager.getAnimal(parentId);
        if (animal && !animal.state.isDead) {
          this.selectionManager.select(animal);
          this.camera.panToPosition(animal.state.position);
        }
      },
    });

    // Create input handler
    this.inputHandler = createInputHandler(this.canvas, this.camera, this.selectionManager, simulation);

    // Create help dialog
    this.helpDialog = createHelpDialog();

    // Set up keyboard shortcut callbacks
    this.inputHandler.setCallbacks({
      onToggleInfoPanel: () => {
        if (this.infoPanel.isVisible()) {
          this.infoPanel.hide();
        } else {
          this.infoPanel.show();
        }
      },
      onToggleGraph: () => {
        if (this.populationGraph.isVisible()) {
          this.populationGraph.hide();
        } else {
          this.populationGraph.show();
        }
      },
      onShowHelp: () => {
        if (this.helpDialog.isVisible()) {
          this.helpDialog.hide();
        } else {
          this.helpDialog.show();
        }
      },
      onToggleVisualization: () => {
        this.controlPanel.toggleVisualization();
      },
    });

    // Wire up selection events
    this.selectionManager.on('selectionChanged', ({ current }) => {
      if (current.type === 'animal' && current.entity) {
        this.sidebar.updateAnimal(current.entity as import('../entities/types').Animal);
      } else if (current.type === 'corpse' && current.entity) {
        this.sidebar.updateCorpse(current.entity as import('../entities/types').Corpse);
      } else {
        this.sidebar.hide();
      }
    });

    // Wire up simulation events
    this.simulation.on('tick', this.handleTick.bind(this));
    this.simulation.on('paused', this.handlePaused.bind(this));
    this.simulation.on('resumed', this.handleResumed.bind(this));
    this.simulation.on('reset', this.handleReset.bind(this));
    this.simulation.on('animalDied', this.handleAnimalDied.bind(this));

    // Wire up control panel events
    this.controlPanel.on('reset', () => {
      this.populationHistory.clear();
      this.selectionManager.deselect();
    });

    this.controlPanel.on('toggleVisualization', ({ visible }) => {
      this.renderer.setOptions({
        showAnimals: visible,
        showVegetation: visible,
        showCorpses: visible,
      });
    });

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initial info update
    this.updateInfoPanel();

    // Show graph by default
    this.populationGraph.show();

    // Start render loop
    this.startRenderLoop();
  }

  private handleTick(data: { tick: number; deerCount: number; wolfCount: number; vegetationCount: number }): void {
    // Record population data
    this.populationHistory.record(data.tick, data.deerCount, data.wolfCount, data.vegetationCount);

    // Update living animal IDs for parent link styling
    const livingAnimals = this.simulation.world.getLivingAnimals();
    const livingIds = new Set(livingAnimals.map(a => a.id));
    this.sidebar.setLivingAnimalIds(livingIds);

    // Refresh selection (entity state may have changed)
    this.selectionManager.refreshSelection(this.simulation.world);

    // Update sidebar if animal selected
    const selectedAnimal = this.selectionManager.getSelectedAnimal();
    if (selectedAnimal) {
      this.sidebar.updateAnimal(selectedAnimal);
    }

    const selectedCorpse = this.selectionManager.getSelectedCorpse();
    if (selectedCorpse) {
      this.sidebar.updateCorpse(selectedCorpse);
    }
  }

  private handlePaused(): void {
    this.controlPanel.syncState(this.simulation);
  }

  private handleResumed(): void {
    this.controlPanel.syncState(this.simulation);
  }

  private handleReset(): void {
    this.populationHistory.clear();
    this.actionHistory.clear();
    this.selectionManager.deselect();
    this.sidebar.hide();
    this.controlPanel.syncState(this.simulation);
    this.infoPanel.resetUptime();
    this.updateInfoPanel();
  }

  private handleAnimalDied(data: { animal: import('../entities/types').Animal; cause: string }): void {
    const selected = this.selectionManager.getSelectedAnimal();
    if (selected && selected.id === data.animal.id) {
      this.selectionManager.deselect();
    }
  }

  private handleResize(): void {
    this.renderer.resize();
    this.populationGraph.resize();
  }

  private updateInfoPanel(): void {
    this.infoPanel.update({
      seed: this.simulation.seed,
      tick: this.simulation.currentTick,
      deerCount: this.simulation.world.getDeerCount(),
      wolfCount: this.simulation.world.getWolfCount(),
      vegetationCount: this.simulation.world.getVegetationCount(),
      corpseCount: this.simulation.world.getAllCorpses().length,
      fps: this.renderer.getFPS(),
    });
  }

  private startRenderLoop(): void {
    const loop = (): void => {
      // Render simulation
      this.renderer.render(this.simulation.world);

      // Update info panel
      this.updateInfoPanel();

      // Render graph
      this.populationGraph.render();

      // Continue loop
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  // Public accessors for debugging
  getCamera(): Camera {
    return this.camera;
  }

  getRenderer(): Renderer {
    return this.renderer;
  }

  getSelectionManager(): SelectionManager {
    return this.selectionManager;
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.inputHandler.destroy();
    this.infoPanel.destroy();
    this.controlPanel.destroy();
    this.sidebar.destroy();
    this.populationGraph.destroy();
    this.helpDialog.destroy();
    this.renderer.destroy();

    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}
