import type { Animal, Corpse, ActionLogEntry } from '../entities/types';
import type { SelectionManager } from './SelectionManager';
import type { SimulationConfig } from '../config/types';
import type { ActionHistory } from '../data/ActionHistory';
import type { EntityId } from '../utils/id';

export interface SidebarCallbacks {
  onParentClick?: (parentId: EntityId) => void;
}

export interface Sidebar {
  updateAnimal(animal: Animal | null): void;
  updateCorpse(corpse: Corpse | null): void;
  setActionHistory(history: ActionHistory): void;
  setCallbacks(callbacks: SidebarCallbacks): void;
  setLivingAnimalIds(ids: Set<EntityId>): void;
  show(): void;
  hide(): void;
  isVisible(): boolean;
  destroy(): void;
}

export function createSidebar(
  container: HTMLElement,
  selectionManager: SelectionManager,
  config: SimulationConfig
): Sidebar {
  let visible = false;
  let actionHistory: ActionHistory | null = null;
  let callbacks: SidebarCallbacks = {};
  let livingAnimalIds = new Set<EntityId>();
  let currentAnimalId: EntityId | null = null;
  let showAllActions = false;

  function formatNumber(n: number, decimals: number = 2): string {
    return n.toFixed(decimals);
  }

  function renderParentLink(parentId: EntityId | null): string {
    if (!parentId) {
      return 'None (initial)';
    }
    const isAlive = livingAnimalIds.has(parentId);
    if (isAlive) {
      return `<a href="#" class="parent-link" data-parent-id="${parentId}">${parentId}</a>`;
    }
    return `<span class="text-muted">${parentId} (deceased)</span>`;
  }

  function renderActionLogSection(animalId: EntityId): string {
    if (!actionHistory) {
      return '';
    }

    const limit = showAllActions ? 50 : 10;
    const entries = actionHistory.getHistory(animalId, limit);

    if (entries.length === 0) {
      return `
        <div class="sidebar-section">
          <h4>Recent Actions</h4>
          <div class="action-log-empty">No actions recorded yet</div>
        </div>
      `;
    }

    const reversedEntries = [...entries].reverse();
    const actionItems = reversedEntries.map(entry =>
      `<div class="action-log-entry">[${entry.tick}] ${entry.action} - ${entry.details}</div>`
    ).join('');

    const showMoreBtn = !showAllActions && entries.length >= 10
      ? `<button class="show-more-btn" id="show-more-actions">Show More</button>`
      : '';

    return `
      <div class="sidebar-section">
        <h4>Recent Actions</h4>
        <div class="action-log">
          ${actionItems}
        </div>
        ${showMoreBtn}
      </div>
    `;
  }

  function renderAnimalContent(animal: Animal): string {
    const isMature = animal.state.age >= animal.lifecycleAttributes.maturityAge;
    const hungerPercent = (animal.state.hunger / config.entities.MAX_HUNGER) * 100;

    const reproductionCost = config.reproduction.REPRODUCTION_COST * animal.lifecycleAttributes.litterSize;
    const reproductionThreshold = (reproductionCost + config.reproduction.REPRODUCTION_SAFETY_BUFFER) * config.entities.MAX_HUNGER;
    const canReproduce = isMature &&
      animal.state.hunger > reproductionThreshold &&
      animal.state.ticksSinceLastReproduction >= config.reproduction.REPRODUCTION_COOLDOWN;

    return `
      <div class="sidebar-header">
        <h3>${animal.species.charAt(0).toUpperCase() + animal.species.slice(1)} #${animal.id.split('_')[1]}</h3>
        <button class="close-btn" id="sidebar-close">&times;</button>
      </div>

      <div class="sidebar-section">
        <h4>State</h4>
        <div class="stat-row">
          <span>Position:</span>
          <span>(${formatNumber(animal.state.position.x, 0)}, ${formatNumber(animal.state.position.y, 0)})</span>
        </div>
        <div class="stat-row">
          <span>Hunger:</span>
          <div class="hunger-display">
            <div class="hunger-bar-container">
              <div class="hunger-bar" style="width: ${hungerPercent}%"></div>
            </div>
            <span>${formatNumber(animal.state.hunger, 0)}/${config.entities.MAX_HUNGER}</span>
          </div>
        </div>
        <div class="stat-row">
          <span>Age:</span>
          <span>${animal.state.age} / ${animal.lifecycleAttributes.maxAge} ticks</span>
        </div>
        <div class="stat-row">
          <span>Mature:</span>
          <span class="${isMature ? 'text-green' : 'text-yellow'}">${isMature ? 'Yes' : `No (${animal.lifecycleAttributes.maturityAge - animal.state.age} ticks)`}</span>
        </div>
        <div class="stat-row">
          <span>Can Reproduce:</span>
          <span class="${canReproduce ? 'text-green' : 'text-red'}">${canReproduce ? 'Yes' : 'No'}</span>
        </div>
        <div class="stat-row">
          <span>Cooldown:</span>
          <span>${Math.max(0, config.reproduction.REPRODUCTION_COOLDOWN - animal.state.ticksSinceLastReproduction)} ticks</span>
        </div>
      </div>

      <div class="sidebar-section">
        <h4>Base Attributes</h4>
        <div class="stat-row"><span>Strength:</span><span>${formatNumber(animal.baseAttributes.strength)}</span></div>
        <div class="stat-row"><span>Agility:</span><span>${formatNumber(animal.baseAttributes.agility)}</span></div>
        <div class="stat-row"><span>Endurance:</span><span>${formatNumber(animal.baseAttributes.endurance)}</span></div>
        <div class="stat-row"><span>Perception:</span><span>${formatNumber(animal.baseAttributes.perception)}</span></div>
        <div class="stat-row"><span>Size:</span><span>${formatNumber(animal.baseAttributes.size)}</span></div>
      </div>

      <div class="sidebar-section">
        <h4>Behavioral Attributes</h4>
        <div class="stat-row"><span>Aggression:</span><span>${formatNumber(animal.behavioralAttributes.aggression)}</span></div>
        <div class="stat-row"><span>Flight Instinct:</span><span>${formatNumber(animal.behavioralAttributes.flightInstinct)}</span></div>
        <div class="stat-row"><span>Food Priority:</span><span>${formatNumber(animal.behavioralAttributes.foodPriorityThreshold)}</span></div>
        <div class="stat-row"><span>Reproductive Urge:</span><span>${formatNumber(animal.behavioralAttributes.reproductiveUrge)}</span></div>
        ${animal.diet.canEatCorpses ? `<div class="stat-row"><span>Carrion Pref:</span><span>${formatNumber(animal.behavioralAttributes.carrionPreference)}</span></div>` : ''}
      </div>

      <div class="sidebar-section">
        <h4>Derived Stats</h4>
        <div class="stat-row"><span>Speed:</span><span>${formatNumber(animal.derivedStats.speed)}</span></div>
        <div class="stat-row"><span>Alert Range:</span><span>${formatNumber(animal.derivedStats.alertRange)}</span></div>
        <div class="stat-row"><span>Attack Power:</span><span>${formatNumber(animal.derivedStats.attackPower)}</span></div>
        <div class="stat-row"><span>Defense:</span><span>${formatNumber(animal.derivedStats.defense)}</span></div>
        <div class="stat-row"><span>Hunger Decay:</span><span>${formatNumber(animal.derivedStats.hungerDecayRate, 3)}/tick</span></div>
      </div>

      <div class="sidebar-section">
        <h4>Lineage</h4>
        <div class="stat-row"><span>Generation:</span><span>${animal.generation}</span></div>
        <div class="stat-row"><span>Parent:</span><span>${renderParentLink(animal.parentId)}</span></div>
      </div>

      <div class="sidebar-section">
        <h4>Diet</h4>
        <div class="stat-row"><span>Vegetation:</span><span class="${animal.diet.canEatVegetation ? 'text-green' : 'text-red'}">${animal.diet.canEatVegetation ? 'Yes' : 'No'}</span></div>
        <div class="stat-row"><span>Animals:</span><span class="${animal.diet.canEatAnimals ? 'text-green' : 'text-red'}">${animal.diet.canEatAnimals ? 'Yes' : 'No'}</span></div>
        <div class="stat-row"><span>Corpses:</span><span class="${animal.diet.canEatCorpses ? 'text-green' : 'text-red'}">${animal.diet.canEatCorpses ? 'Yes' : 'No'}</span></div>
      </div>

      ${renderActionLogSection(animal.id)}
    `;
  }

  function renderCorpseContent(corpse: Corpse): string {
    return `
      <div class="sidebar-header">
        <h3>${corpse.sourceSpecies.charAt(0).toUpperCase() + corpse.sourceSpecies.slice(1)} Corpse</h3>
        <button class="close-btn" id="sidebar-close">&times;</button>
      </div>

      <div class="sidebar-section">
        <h4>Corpse Info</h4>
        <div class="stat-row">
          <span>Source ID:</span>
          <span>${corpse.sourceId}</span>
        </div>
        <div class="stat-row">
          <span>Position:</span>
          <span>(${formatNumber(corpse.position.x, 0)}, ${formatNumber(corpse.position.y, 0)})</span>
        </div>
        <div class="stat-row">
          <span>Food Value:</span>
          <span>${formatNumber(corpse.foodValue, 1)}</span>
        </div>
        <div class="stat-row">
          <span>Original Size:</span>
          <span>${formatNumber(corpse.sourceSize)}</span>
        </div>
        <div class="stat-row">
          <span>Decay Timer:</span>
          <span>${corpse.decayTimer} ticks remaining</span>
        </div>
      </div>
    `;
  }

  function attachEventHandlers(): void {
    // Close button
    const closeBtn = container.querySelector('#sidebar-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        selectionManager.deselect();
      });
    }

    // Parent links
    const parentLinks = container.querySelectorAll('.parent-link');
    parentLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const parentId = (e.target as HTMLElement).dataset.parentId;
        if (parentId && callbacks.onParentClick) {
          callbacks.onParentClick(parentId as EntityId);
        }
      });
    });

    // Show more actions button
    const showMoreBtn = container.querySelector('#show-more-actions');
    if (showMoreBtn) {
      showMoreBtn.addEventListener('click', () => {
        showAllActions = true;
        if (currentAnimalId) {
          const animal = selectionManager.getSelectedAnimal();
          if (animal) {
            container.innerHTML = renderAnimalContent(animal);
            attachEventHandlers();
          }
        }
      });
    }
  }

  return {
    updateAnimal(animal: Animal | null): void {
      if (!animal) {
        this.hide();
        return;
      }
      // Reset showAllActions when switching animals
      if (currentAnimalId !== animal.id) {
        showAllActions = false;
      }
      currentAnimalId = animal.id;
      container.innerHTML = renderAnimalContent(animal);
      attachEventHandlers();
      this.show();
    },

    updateCorpse(corpse: Corpse | null): void {
      if (!corpse) {
        this.hide();
        return;
      }
      currentAnimalId = null;
      container.innerHTML = renderCorpseContent(corpse);
      attachEventHandlers();
      this.show();
    },

    setActionHistory(history: ActionHistory): void {
      actionHistory = history;
    },

    setCallbacks(newCallbacks: SidebarCallbacks): void {
      callbacks = newCallbacks;
    },

    setLivingAnimalIds(ids: Set<EntityId>): void {
      livingAnimalIds = ids;
    },

    show(): void {
      visible = true;
      container.classList.add('visible');
    },

    hide(): void {
      visible = false;
      container.classList.remove('visible');
    },

    isVisible(): boolean {
      return visible;
    },

    destroy(): void {
      container.innerHTML = '';
      container.classList.remove('visible');
    },
  };
}
