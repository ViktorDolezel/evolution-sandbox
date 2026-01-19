import type { Animal, Corpse } from '../entities/types';
import type { SelectionManager } from './SelectionManager';
import type { SimulationConfig } from '../config/types';

export interface Sidebar {
  updateAnimal(animal: Animal | null): void;
  updateCorpse(corpse: Corpse | null): void;
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

  function formatNumber(n: number, decimals: number = 2): string {
    return n.toFixed(decimals);
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
        <div class="stat-row"><span>Parent 1:</span><span>${animal.parentIds[0] || 'None (initial)'}</span></div>
        <div class="stat-row"><span>Parent 2:</span><span>${animal.parentIds[1] || 'None (initial)'}</span></div>
      </div>

      <div class="sidebar-section">
        <h4>Diet</h4>
        <div class="stat-row"><span>Vegetation:</span><span class="${animal.diet.canEatVegetation ? 'text-green' : 'text-red'}">${animal.diet.canEatVegetation ? 'Yes' : 'No'}</span></div>
        <div class="stat-row"><span>Animals:</span><span class="${animal.diet.canEatAnimals ? 'text-green' : 'text-red'}">${animal.diet.canEatAnimals ? 'Yes' : 'No'}</span></div>
        <div class="stat-row"><span>Corpses:</span><span class="${animal.diet.canEatCorpses ? 'text-green' : 'text-red'}">${animal.diet.canEatCorpses ? 'Yes' : 'No'}</span></div>
      </div>
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

  function attachCloseHandler(): void {
    const closeBtn = container.querySelector('#sidebar-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        selectionManager.deselect();
      });
    }
  }

  return {
    updateAnimal(animal: Animal | null): void {
      if (!animal) {
        this.hide();
        return;
      }
      container.innerHTML = renderAnimalContent(animal);
      attachCloseHandler();
      this.show();
    },

    updateCorpse(corpse: Corpse | null): void {
      if (!corpse) {
        this.hide();
        return;
      }
      container.innerHTML = renderCorpseContent(corpse);
      attachCloseHandler();
      this.show();
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
